import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { agentId } = await params;
    const body = await req.json();
    const { message, conversationId } = body as { message: string; conversationId?: string };

    if (!message?.trim()) {
        return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    // Buscar agente + documentos
    const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("*, agent_documents(name, content_text, file_type)")
        .eq("id", agentId)
        .eq("is_active", true)
        .single();

    if (agentError || !agent) {
        return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });
    }

    // Montar ou recuperar conversa
    let convId = conversationId;
    if (!convId) {
        const { data: conv } = await supabase
            .from("conversations")
            .insert({
                user_id: user.id,
                agent_id: agentId,
                title: message.slice(0, 60),
            })
            .select()
            .single();
        convId = conv?.id;
    }

    if (!convId) {
        return NextResponse.json({ error: "Não foi possível criar conversa" }, { status: 500 });
    }

    // Salvar mensagem do usuário
    await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: message,
    });

    // Buscar histórico (últimas 20 mensagens)
    const { data: history } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(20);

    // Construir system prompt com documentos
    const docsContext = agent.agent_documents
        ?.filter((d: any) => d.content_text)
        .map((d: any) => `\n\n=== DOCUMENTO: ${d.name} ===\n${d.content_text}`)
        .join("") || "";

    const systemPrompt = `${agent.system_prompt}${docsContext ? `\n\n## DOCUMENTOS DE REFERÊNCIA${docsContext}` : ""}`;

    // Chamar OpenAI com streaming
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...(history?.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })) || []),
    ];

    const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
    });

    // Stream a resposta para o cliente e acumular para salvar no banco
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    if (text) {
                        fullResponse += text;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, conversationId: convId })}\n\n`));
                    }
                }
                // Salvar resposta completa no banco
                await supabase.from("messages").insert({
                    conversation_id: convId,
                    role: "assistant",
                    content: fullResponse,
                });
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`));
                controller.close();
            } catch (err) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Erro ao gerar resposta" })}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
