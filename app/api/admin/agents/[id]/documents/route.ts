import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";

// GET /api/admin/agents/[id]/documents
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
        .from("agent_documents")
        .select("id, name, file_type, file_size, created_at")
        .eq("agent_id", id)
        .order("created_at", { ascending: false });

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/admin/agents/[id]/documents — salva metadados após upload direto ao Storage
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id: agentId } = await params;
        const { name, filePath, fileType, fileSize, contentText } = await req.json();

        if (!name || !fileType) {
            return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
        }

        // Para PDF: extrair texto do arquivo no Storage antes de salvar
        let extractedText: string | null = contentText ?? null;
        if (fileType === "pdf" && filePath) {
            try {
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
                const serviceClient = createServiceClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceKey
                );
                const { data: fileData, error: downloadError } = await serviceClient.storage
                    .from("agent-documents")
                    .download(filePath);

                if (!downloadError && fileData) {
                    const arrayBuffer = await fileData.arrayBuffer();
                    const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
                    extractedText = text?.trim() || null;
                }
            } catch {
                // Extração falhou — continua sem texto (não bloqueia o upload)
            }
        }

        const supabase = await createClient();
        const { data, error: dbError } = await supabase
            .from("agent_documents")
            .insert({
                agent_id: agentId,
                name,
                file_path: filePath ?? null,
                content_text: extractedText,
                file_type: fileType,
                file_size: fileSize ?? null,
            })
            .select()
            .single();

        if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });

    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Erro inesperado" }, { status: 500 });
    }
}

// DELETE /api/admin/agents/[id]/documents?docId=xxx
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const docId = req.nextUrl.searchParams.get("docId");
        if (!docId) return NextResponse.json({ error: "docId é obrigatório" }, { status: 400 });

        const supabase = await createClient();

        const { data: doc } = await supabase
            .from("agent_documents")
            .select("file_path")
            .eq("id", docId)
            .single();

        // Se tiver arquivo no Storage, remove
        if (doc?.file_path) {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceKey) {
                const serviceClient = createServiceClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceKey
                );
                await serviceClient.storage.from("agent-documents").remove([doc.file_path]);
            }
        }

        const { error: dbError } = await supabase.from("agent_documents").delete().eq("id", docId);
        if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Erro inesperado" }, { status: 500 });
    }
}
