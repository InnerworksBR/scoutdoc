import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import OpenAI from "openai";
import { embedQuery } from "@/lib/rag";

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

    // ── Construir contexto de documentos (impl. 008/010 — RAG com relevância) ────
    // Busca trechos por similaridade vetorial e descarta os irrelevantes por um
    // limiar. Distingue 3 situações:
    //   1. Agente sem índice          → fallback ao texto truncado (legado)
    //   2. Indexado, há trechos bons   → injeta só os relevantes
    //   3. Indexado, nada relevante    → NÃO injeta nada (responde sem citar)
    const MAX_CHARS_PER_DOC = 8000;
    // Similaridade de cosseno mínima (0..1) para um trecho ser considerado relevante.
    // text-embedding-3-small: ~0.30 separa bem relevante de tangencial.
    // Ajustável via env RAG_MIN_SIMILARITY (ex.: 0.35 = mais rígido, 0.25 = mais permissivo).
    const RAG_MIN_SIMILARITY = Number(process.env.RAG_MIN_SIMILARITY) || 0.3;
    const RAG_CANDIDATES = 12;   // candidatos buscados antes de filtrar
    const RAG_MAX_USED = 6;      // trechos efetivamente usados após o filtro

    async function retrieveRelevantChunks(): Promise<{ indexed: boolean; chunks: { name: string; text: string }[] }> {
        const queryText = message?.trim();
        if (!queryText) return { indexed: false, chunks: [] }; // só imagem → sem busca

        try {
            const { count } = await supabase
                .from("agent_document_chunks")
                .select("id", { count: "exact", head: true })
                .eq("agent_id", agentId);

            if (!count || count === 0) return { indexed: false, chunks: [] };

            const queryEmbedding = await embedQuery(queryText);
            const { data: matches, error: matchError } = await supabase.rpc("match_agent_chunks", {
                p_agent_id: agentId,
                p_query_embedding: queryEmbedding,
                p_match_count: RAG_CANDIDATES,
            });

            if (matchError || !matches) return { indexed: true, chunks: [] };

            const relevant = (matches as { name: string; content: string; similarity: number }[])
                .filter((m) => (m.similarity ?? 0) >= RAG_MIN_SIMILARITY)
                .slice(0, RAG_MAX_USED)
                .map((m) => ({ name: m.name, text: m.content }));

            return { indexed: true, chunks: relevant };
        } catch (err) {
            console.error("Falha na recuperação RAG:", err);
            return { indexed: false, chunks: [] };
        }
    }

    const rag = await retrieveRelevantChunks();
    let docsWithText = rag.chunks;

    // Fallback ao método antigo SOMENTE quando o agente não está indexado.
    // (Se está indexado mas nada passou no limiar, mantém vazio de propósito.)
    if (!rag.indexed) {
        docsWithText = (agent.agent_documents ?? [])
            .filter((d: any) => d.content_text)
            .map((d: any) => ({ name: d.name as string, text: (d.content_text as string).slice(0, MAX_CHARS_PER_DOC) }));
    }

    const docsContext = docsWithText
        .map((d) => `\n\n=== DOCUMENTO: ${d.name} ===\n[Citar como: [Fonte: ${d.name}]]\n${d.text}`)
        .join("");

    const citationInstruction = docsWithText.length > 0
        ? `\n\n## INSTRUÇÃO DE USO DOS DOCUMENTOS\nOs trechos abaixo foram recuperados por busca e PODEM ser relevantes para a pergunta — avalie antes de usar.\n- Use um trecho APENAS se ele realmente contiver a informação que responde à pergunta. Nesse caso, cite a fonte imediatamente após a afirmação com o marcador exato: [Fonte: nome-do-documento] (use o nome indicado em "Citar como").\n- Se os trechos NÃO tratarem do que foi perguntado, IGNORE-OS e responda com seu próprio conhecimento, SEM citar fontes e sem mencionar os documentos.\n- Nunca invente fontes nem force uma citação só porque um documento foi fornecido.\n\n## TRECHOS POSSIVELMENTE RELEVANTES`
        : "";

    const systemPrompt = docsWithText.length > 0
        ? `${agent.system_prompt}${citationInstruction}${docsContext}`
        : `${agent.system_prompt}\n\nIMPORTANTE: Não há documentos de referência relevantes para esta pergunta. Responda com base no seu conhecimento e NÃO cite fontes ou documentos.`;

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
