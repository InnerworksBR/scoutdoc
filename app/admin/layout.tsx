import Link from "next/link";
import { Compass, Bot, LayoutDashboard, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { signout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") redirect("/dashboard");

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col">
            {/* Top Bar */}
            <nav className="border-b border-cream-200 bg-white sticky top-0 z-30">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center space-x-2 text-scout-700">
                            <Compass className="w-5 h-5" strokeWidth={2} />
                            <span className="font-display font-bold">ScoutDoc<span className="text-azure-500">.AI</span></span>
                        </Link>
                        <ChevronRight className="w-4 h-4 text-cream-400" />
                        <span className="text-sm font-semibold text-azure-600 bg-azure-50 px-2 py-0.5 rounded">Admin</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="text-scout-600 text-xs">Dashboard</Button>
                        </Link>
                        <form action={signout}>
                            <Button variant="ghost" size="sm" className="text-scout-500 text-xs">Sair</Button>
                        </form>
                    </div>
                </div>
            </nav>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-56 border-r border-cream-200 bg-white hidden md:flex flex-col p-4 gap-1">
                    <p className="text-xs text-scout-400 font-semibold uppercase tracking-wider mb-2 px-2">Menu Admin</p>
                    <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-scout-700 hover:bg-scout-50 hover:text-scout-900 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Visão Geral
                    </Link>
                    <Link href="/admin/agents" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-scout-700 hover:bg-scout-50 hover:text-scout-900 transition-colors">
                        <Bot className="w-4 h-4" /> Agentes IA
                    </Link>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
