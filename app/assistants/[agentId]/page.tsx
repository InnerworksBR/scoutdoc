import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";

export default async function AgentChatPage({ params }: { params: Promise<{ agentId: string }> }) {
    const { agentId } = await params;
    const supabase = await createClient();

    const [{ data: agent }, { data: { user } }] = await Promise.all([
        supabase
            .from("agents")
            .select("id, name, description, avatar_color, avatar_url, welcome_message, suggestions, produces_document, document_template, document_title")
            .eq("id", agentId)
            .eq("is_active", true)
            .single(),
        supabase.auth.getUser(),
    ]);

    if (!agent) notFound();

    const [{ data: conversations }, { data: profile }] = await Promise.all([
        supabase
            .from("conversations")
            .select("id, title, created_at")
            .eq("user_id", user!.id)
            .eq("agent_id", agentId)
            .order("created_at", { ascending: false })
            .limit(20),
        supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user!.id)
            .single(),
    ]);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <ChatInterface
                agentId={agent.id}
                agentName={agent.name}
                agentDescription={agent.description ?? undefined}
                agentColor={agent.avatar_color || "oklch(0.38 0.17 145)"}
                agentAvatarUrl={agent.avatar_url ?? null}
                userEmail={user?.email ?? undefined}
                userAvatarUrl={profile?.avatar_url ?? null}
                conversations={conversations || []}
                welcomeMessage={agent.welcome_message ?? null}
                suggestions={Array.isArray(agent.suggestions) ? agent.suggestions as string[] : null}
                producesDocument={agent.produces_document ?? false}
                documentTemplate={agent.document_template ?? null}
                documentTitle={(agent.document_title as string | null) ?? null}
            />
        </div>
    );
}
