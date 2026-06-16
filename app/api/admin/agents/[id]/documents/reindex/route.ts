import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { indexDocumentChunks } from "@/lib/rag";

// POST /api/admin/agents/[id]/documents/reindex
// Reindexa (chunk + embeddings) todos os documentos do agente que tenham texto extraído.
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id: agentId } = await params;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: docs, error: dbError } = await supabase
        .from("agent_documents")
        .select("id, name, content_text")
        .eq("agent_id", agentId);

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    let documentsIndexed = 0;
    let chunksTotal = 0;
    const failures: string[] = [];

    for (const doc of docs ?? []) {
        const text = (doc.content_text as string | null)?.trim();
        if (!text) continue;
        try {
            const n = await indexDocumentChunks(serviceClient, {
                documentId: doc.id as string,
                agentId,
                contentText: text,
            });
            documentsIndexed += 1;
            chunksTotal += n;
        } catch (err) {
            console.error(`Falha ao reindexar "${doc.name}":`, err);
            failures.push(doc.name as string);
        }
    }

    return NextResponse.json({
        documents: documentsIndexed,
        chunks: chunksTotal,
        failures,
    });
}
