import AgentForm from "@/components/admin/AgentForm";

export default function NewAgentPage() {
    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-display font-bold text-scout-900">Criar Novo Agente</h1>
                <p className="text-scout-500 text-sm">Configure o assistente IA que os escoteiros irão usar.</p>
            </div>
            <AgentForm />
        </div>
    );
}
