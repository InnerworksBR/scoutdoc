import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/agents — listar todos os agentes
export async function GET() {
    const { error } = await requireAdmin();
    if (error) return error;

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
        .from("agents")
        .select("*, agent_documents(count)")
        .order("created_at", { ascending: false });

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/admin/agents — criar agente
export async function POST(req: NextRequest) {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { name, description, system_prompt, avatar_color, is_active } = body;

    if (!name || !system_prompt) {
        return NextResponse.json({ error: "nome e system_prompt são obrigatórios" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
        .from("agents")
        .insert({
            name,
            description,
            system_prompt,
            avatar_color: avatar_color || "linear-gradient(135deg, #38a169, #3b82f6)",
            is_active: is_active ?? true,
            created_by: user!.id,
        })
        .select()
        .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
