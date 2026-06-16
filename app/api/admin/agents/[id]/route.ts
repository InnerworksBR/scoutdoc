import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/agents/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
        .from("agents")
        .select("*, agent_documents(*)")
        .eq("id", id)
        .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });
    return NextResponse.json(data);
}

function normalizeSuggestions(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
        .slice(0, 6);
}

// PUT /api/admin/agents/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const { name, description, system_prompt, avatar_color, is_active, welcome_message, suggestions } = body;

    if (suggestions !== undefined && suggestions !== null && !Array.isArray(suggestions)) {
        return NextResponse.json({ error: "suggestions deve ser um array de strings" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
        .from("agents")
        .update({
            name,
            description,
            system_prompt,
            avatar_color,
            is_active,
            welcome_message: welcome_message?.trim() || null,
            suggestions: normalizeSuggestions(suggestions),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(data);
}

// DELETE /api/admin/agents/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const supabase = await createClient();
    const { error: dbError } = await supabase.from("agents").delete().eq("id", id);

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
