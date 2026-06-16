import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/supabase/admin";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id: agentId } = await params;
    const { name, contentType } = await req.json();

    if (!ALLOWED_TYPES.includes(contentType)) {
        return NextResponse.json({ error: "Tipo de arquivo não permitido. Use PNG, JPG ou WebP." }, { status: 400 });
    }

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
        .from("avatars")
        .createSignedUploadUrl(filePath);

    if (urlError) {
        return NextResponse.json({ error: urlError.message }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;

    return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
