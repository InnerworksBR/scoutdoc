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
    const { message, conversationId, imageUrl } = body as {
        message: string;
        conversationId?: string;
        imageUrl?: string | null;
    };

    if (!message?.trim() && !imageUrl) {
        return NextResponse.json({ error: "Mensagem ou imagem é obrigatória" }, { status: 400 });
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
        const title = message?.trim().slice(0, 60) || "Conversa com imagem";
        const { data: conv } = await supabase
            .from("conversations")
            .insert({ user_id: user.id, agent_id: agentId, title })
            .select()
            .single();
        convId = conv?.id;
    }

    if (!convId) {
        return NextResponse.json({ error: "Não foi possível criar conversa" }, { status: 500 });
    }

    // Salvar mensagem do usuário (com image_url se houver)
    await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: message?.trim() || "",
        image_url: imageUrl ?? null,
    });

    // Buscar histórico (últimas 20 mensagens)
    const { data: history } = await supabase
        .from("messages")
        .select("role, content, image_url")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(20);

    // Construir system prompt com documentos e rótulos de citação
    const MAX_CHARS_PER_DOC = 8000;
    const docsWithText: { name: string; text: string }[] = (agent.agent_documents ?? [])
        .filter((d: any) => d.content_text)
        .map((d: any) => ({ name: d.name as string, text: (d.content_text as string).slice(0, MAX_CHARS_PER_DOC) }));

    const docsContext = docsWithText
        .map((d) => `\n\n=== DOCUMENTO: ${d.name} ===\n[Citar como: [Fonte: ${d.name}]]\n${d.text}`)
        .join("");

    const citationInstruction = docsWithText.length > 0
        ? `\n\n## INSTRUÇÃO DE CITAÇÃO\nSempre que usar informação de um dos documentos acima, cite a fonte IMEDIATAMENTE após a afirmação usando o marcador exato: [Fonte: nome-do-documento]. Use o nome exato conforme indicado em "Citar como". Exemplo: "O método escoteiro se baseia no aprendizado pela prática [Fonte: POR.pdf]." Se a informação não vier dos documentos, não invente fontes.\n\n## DOCUMENTOS DE REFERÊNCIA`
        : "";

    const systemPrompt = docsWithText.length > 0
        ? `${agent.system_prompt}${citationInstruction}${docsContext}`
        : `${agent.system_prompt}\n\nIMPORTANTE: Não há documentos de referência disponíveis nesta sessão. Responda com base no seu conhecimento e NÃO cite fontes ou documentos.`;

    // Converter histórico para mensagens OpenAI (suporte multimodal)
    const buildUserContent = (
        text: string,
        imgUrl: string | null,
    ): string | OpenAI.Chat.ChatCompletionContentPart[] => {
        if (!imgUrl) return text || " ";
        const parts: OpenAI.Chat.ChatCompletionContentPart[] = [];
        if (text) parts.push({ type: "text" as const, text });
        parts.push({
            type: "image_url" as const,
            image_url: { url: imgUrl, detail: "auto" as const },
        });
        return parts;
    };

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...(history?.map((m: any) => {
            if (m.role === "user") {
                return {
                    role: "user" as const,
                    content: buildUserContent(m.content, m.image_url ?? null),
                };
            }
            return { role: "assistant" as const, content: m.content as string };
        }) || []),
    ];

    const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
    });

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
                await supabase.from("messages").insert({
                    conversation_id: convId,
                    role: "assistant",
                    content: fullResponse,
                });
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`));
                controller.close();
            } catch {
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
