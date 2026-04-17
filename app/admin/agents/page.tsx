import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Bot, FileText, ToggleLeft, ToggleRight, Pencil } from "lucide-react";

export default async function AdminAgents() {
    const supabase = await createClient();
    const { data: agents } = await supabase
        .from("agents")
        .select("*, agent_documents(count)")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-scout-900">Agentes IA</h1>
                    <p className="text-scout-500 text-sm">Crie e gerencie assistentes para os chefes escoteiros.</p>
                </div>
                <Link href="/admin/agents/new">
                    <Button variant="scout">
                        <Plus className="w-4 h-4 mr-2" /> Novo Agente
                    </Button>
                </Link>
            </div>

            {/* Agent List */}
            {agents && agents.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => (
                        <div key={agent.id} className="bg-white rounded-xl border border-cream-200 shadow-sm hover:border-scout-200 hover:shadow-md transition-all p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow text-sm"
                                    style={{ background: agent.avatar_color }}
                                >
                                    {agent.name[0].toUpperCase()}
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    agent.is_active ? "bg-scout-100 text-scout-700" : "bg-cream-200 text-scout-500"
                                }`}>
                                    {agent.is_active ? "Ativo" : "Inativo"}
                                </span>
                            </div>
                            <h3 className="font-display font-bold text-scout-900 mb-1">{agent.name}</h3>
                            {agent.description && (
                                <p className="text-xs text-scout-500 mb-3 line-clamp-2">{agent.description}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-scout-400 mb-4">
                                <FileText className="w-3 h-3" />
                                <span>{agent.agent_documents?.[0]?.count ?? 0} documento(s)</span>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/admin/agents/${agent.id}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full border-scout-200 text-scout-700 text-xs">
                                        <Pencil className="w-3 h-3 mr-1" /> Editar
                                    </Button>
                                </Link>
                                <Link href={`/admin/agents/${agent.id}/documents`} className="flex-1">
                                    <Button variant="azure" size="sm" className="w-full text-xs">
                                        <FileText className="w-3 h-3 mr-1" /> Docs
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border-2 border-dashed border-cream-300 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-azure-50 rounded-full flex items-center justify-center mb-4">
                        <Bot className="w-6 h-6 text-azure-500" />
                    </div>
                    <h3 className="font-display font-bold text-scout-800 mb-2">Nenhum agente criado</h3>
                    <p className="text-scout-500 text-sm mb-6">Crie seu primeiro assistente IA para os escoteiros.</p>
                    <Link href="/admin/agents/new">
                        <Button variant="scout">
                            <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Agente
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
