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

function normalizeSuggestions(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
        .slice(0, 6);
}

// POST /api/admin/agents — criar agente
export async function POST(req: NextRequest) {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { name, description, system_prompt, avatar_color, is_active, welcome_message, suggestions } = body;

    if (!name || !system_prompt) {
        return NextResponse.json({ error: "nome e system_prompt são obrigatórios" }, { status: 400 });
    }

    if (suggestions !== undefined && suggestions !== null && !Array.isArray(suggestions)) {
        return NextResponse.json({ error: "suggestions deve ser um array de strings" }, { status: 400 });
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
            welcome_message: welcome_message?.trim() || null,
            suggestions: normalizeSuggestions(suggestions),
        })
        .select()
        .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
