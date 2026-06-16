import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { agentId } = await params;
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
    const filePath = `${user.id}/${agentId}/${Date.now()}_${safeName}`;

    const { data, error: urlError } = await serviceClient.storage
        .from("agent-chat-images")
        .createSignedUploadUrl(filePath);

    if (urlError) {
        return NextResponse.json({ error: urlError.message }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/agent-chat-images/${filePath}`;

    return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
