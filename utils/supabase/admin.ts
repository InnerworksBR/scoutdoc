import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Verifica se o usuário logado é admin.
 * Retorna { user, isAdmin } ou lança um NextResponse 401/403.
 */
export async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
            user: null,
            isAdmin: false,
        };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return {
            error: NextResponse.json({ error: "Acesso negado. Somente administradores." }, { status: 403 }),
            user,
            isAdmin: false,
        };
    }

    return { error: null, user, isAdmin: true, supabase };
}
