import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DocumentManager from "@/components/admin/DocumentManager";

export default async function AgentDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: agent, error } = await supabase
        .from("agents")
        .select("id, name, agent_documents(id, name, file_type, file_size, created_at)")
        .eq("id", id)
        .single();

    if (error || !agent) notFound();

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <Link href={`/admin/agents/${id}`}>
                    <Button variant="ghost" size="sm" className="text-scout-600">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-display font-bold text-scout-900">Documentos</h1>
                    <p className="text-scout-500 text-sm">{agent.name}</p>
                </div>
            </div>

            <div className="bg-azure-50 border border-azure-200 rounded-lg p-4 text-sm text-azure-800">
                <strong>Como funciona:</strong> Faça upload de arquivos PDF ou TXT. O conteúdo será adicionado ao contexto do agente automaticamente, permitindo que ele responda com base nesses documentos.
            </div>

            <DocumentManager agentId={id} initialDocuments={agent.agent_documents || []} />
        </div>
    );
}
