import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, FileText, Plus } from "lucide-react";

export default async function AdminOverview() {
    const supabase = await createClient();

    const [{ count: agentsCount }, { count: convCount }, { count: docsCount }] = await Promise.all([
        supabase.from("agents").select("*", { count: "exact", head: true }),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
    ]);

    const stats = [
        { label: "Agentes Ativos", value: agentsCount ?? 0, icon: Bot, color: "text-azure-600", bg: "bg-azure-50" },
        { label: "Conversas", value: convCount ?? 0, icon: MessageSquare, color: "text-scout-600", bg: "bg-scout-50" },
        { label: "PUDs Gerados", value: docsCount ?? 0, icon: FileText, color: "text-gold-600", bg: "bg-gold-300/20" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-display font-bold text-scout-900">Visão Geral</h1>
                <p className="text-scout-500 text-sm">Gerencie os recursos da plataforma.</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-6 border border-cream-200 shadow-sm">
                        <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-4`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-3xl font-display font-bold text-scout-900">{stat.value}</p>
                        <p className="text-sm text-scout-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-display font-bold text-scout-800 mb-4">Ações Rápidas</h2>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/agents/new">
                        <Button variant="scout">
                            <Plus className="w-4 h-4 mr-2" /> Criar Agente
                        </Button>
                    </Link>
                    <Link href="/admin/agents">
                        <Button variant="outline" className="border-scout-200 text-scout-700">
                            <Bot className="w-4 h-4 mr-2" /> Gerenciar Agentes
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
