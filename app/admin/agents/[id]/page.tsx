import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import AgentForm from "@/components/admin/AgentForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: agent, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !agent) notFound();

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-scout-900">Editar Agente</h1>
                    <p className="text-scout-500 text-sm">{agent.name}</p>
                </div>
                <Link href={`/admin/agents/${id}/documents`}>
                    <Button variant="azure" size="sm">
                        <FileText className="w-4 h-4 mr-2" /> Gerenciar Documentos
                    </Button>
                </Link>
            </div>
            <AgentForm agent={agent} />
        </div>
    );
}
