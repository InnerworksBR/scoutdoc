import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/supabase/admin";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// POST — gera uma signed URL para upload direto do browser para o Storage
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id: agentId } = await params;
    const { name } = await req.json();

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
    }

    const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    );

    const safeName = name.replace(/[^a-z0-9._-]/gi, "_");
    const filePath = `${agentId}/${Date.now()}_${safeName}`;

    const { data, error: urlError } = await serviceClient.storage
        .from("agent-documents")
        .createSignedUploadUrl(filePath);

    if (urlError) {
        return NextResponse.json({ error: urlError.message }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, filePath });
}
