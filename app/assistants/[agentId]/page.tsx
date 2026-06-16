import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";

export default async function AgentChatPage({ params }: { params: Promise<{ agentId: string }> }) {
    const { agentId } = await params;
    const supabase = await createClient();

    const [{ data: agent }, { data: { user } }] = await Promise.all([
        supabase.from("agents").select("id, name, description, avatar_color, welcome_message, suggestions").eq("id", agentId).eq("is_active", true).single(),
        supabase.auth.getUser(),
    ]);

    if (!agent) notFound();

    const { data: conversations } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", user!.id)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(20);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <ChatInterface
                agentId={agent.id}
                agentName={agent.name}
                agentDescription={agent.description ?? undefined}
                agentColor={agent.avatar_color || "oklch(0.38 0.17 145)"}
                userEmail={user?.email ?? undefined}
                conversations={conversations || []}
                welcomeMessage={agent.welcome_message ?? null}
                suggestions={Array.isArray(agent.suggestions) ? agent.suggestions as string[] : null}
            />
        </div>
    );
}
