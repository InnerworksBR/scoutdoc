import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { documentTemplateSchema, mapDynamicJsonToSections, formatPreviewContent } from "@/lib/document-template";
import { generateStructuredDocument } from "@/lib/ai";
import { DocxGenerator } from "@/lib/docx-generator";
import { PdfGenerator } from "@/lib/pdf-generator";

export const runtime = "nodejs";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { agentId } = await params;
    const body = await req.json();
    const {
        conversationId,
        format = "docx",
        preview = false,
    } = body as { conversationId?: string; format?: "docx" | "pdf"; preview?: boolean };

    if (!conversationId) {
        return NextResponse.json({ error: "conversationId é obrigatório" }, { status: 400 });
    }

    // Fetch agent with template and reference documents
    const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id, name, produces_document, document_template, document_title, agent_documents(name, content_text)")
        .eq("id", agentId)
        .eq("is_active", true)
        .single();

    if (agentError || !agent) {
        return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });
    }

    if (!agent.produces_document) {
        return NextResponse.json({ error: "Este agente não gera documentos" }, { status: 400 });
    }

    const templateParsed = documentTemplateSchema.safeParse(agent.document_template);
    if (!templateParsed.success) {
        return NextResponse.json(
            { error: "Template de documento inválido no agente" },
            { status: 400 }
        );
    }
    const template = templateParsed.data;

    // Verify conversation belongs to this user
    const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .eq("agent_id", agentId)
        .single();

    if (convError || !conversation) {
        return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    // Fetch conversation history (last 20 messages)
    const { data: history } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(20);

    if (!history || history.length === 0) {
        return NextResponse.json({ error: "Conversa sem mensagens" }, { status: 400 });
    }

    // Prepare reference documents
    const MAX_CHARS_PER_DOC = 8000;
    const docs = (agent.agent_documents ?? [])
        .filter((d: any) => d.content_text)
        .map((d: any) => ({
            name: d.name as string,
            text: (d.content_text as string).slice(0, MAX_CHARS_PER_DOC),
        }));

    // Generate structured JSON from GPT-4o
    let dynamicJson;
    try {
        dynamicJson = await generateStructuredDocument(
            template,
            history.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
            docs
        );
    } catch (err: any) {
        if (err.message === "STRUCTURED_DOCUMENT_FAILED") {
            return NextResponse.json(
                { error: "Não foi possível estruturar o documento. Tente novamente." },
                { status: 422 }
            );
        }
        console.error("Document generation error:", err);
        return NextResponse.json({ error: "Erro ao gerar documento" }, { status: 500 });
    }

    // Preview mode — return structured JSON for display
    if (preview) {
        return NextResponse.json({
            title: dynamicJson.title ?? template.title ?? agent.name,
            content: formatPreviewContent(dynamicJson, template),
            sections: dynamicJson.sections,
            citations: dynamicJson.citations ?? [],
        });
    }

    // Build document model and generate file
    const sections = mapDynamicJsonToSections(template, dynamicJson);
    const documentModel = { sections };
    const documentTitle =
        (agent.document_title as string | null) ?? template.title ?? `Documento - ${agent.name}`;
    const filename = documentTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    try {
        if (format === "pdf") {
            const buffer = await PdfGenerator.generateFromModel(documentModel);
            const response = new NextResponse(new Blob([buffer as any]));
            response.headers.set("Content-Type", "application/pdf");
            response.headers.set("Content-Disposition", `attachment; filename="${filename}.pdf"`);
            return response;
        } else {
            const buffer = await DocxGenerator.generateFromModel(documentModel);
            const response = new NextResponse(new Blob([buffer as any]));
            response.headers.set(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );
            response.headers.set("Content-Disposition", `attachment; filename="${filename}.docx"`);
            return response;
        }
    } catch (err) {
        console.error("File generation error:", err);
        return NextResponse.json({ error: "Erro ao gerar arquivo" }, { status: 500 });
    }
}
