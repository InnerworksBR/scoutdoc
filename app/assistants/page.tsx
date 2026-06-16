import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Compass, MessageSquare, ArrowLeft, Bot } from "lucide-react";
import { signout } from "@/app/login/actions";

export default async function AssistantsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: agents } = await supabase
        .from("agents")
        .select("id, name, description, avatar_color, avatar_url")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col font-body">
            <nav className="border-b border-cream-200 bg-white sticky top-0 z-30">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center space-x-2 text-scout-700">
                        <Compass className="w-6 h-6" strokeWidth={2} />
                        <span className="font-display font-bold text-lg">
                            ScoutDoc<span className="text-azure-500">.AI</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="text-scout-600 text-xs">
                                <ArrowLeft className="w-3 h-3 mr-1" /> Dashboard
                            </Button>
                        </Link>
                        <form action={signout}>
                            <Button variant="ghost" size="sm" className="text-scout-500 text-xs">Sair</Button>
                        </form>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 flex-1">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-scout-900 flex items-center gap-3">
                        <MessageSquare className="w-7 h-7 text-azure-500" />
                        Assistentes IA
                    </h1>
                    <p className="text-scout-600 mt-1">Tire suas dúvidas com especialistas escoteiros movidos a IA.</p>
                </div>

                {agents && agents.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {agents.map((agent) => (
                            <Link key={agent.id} href={`/assistants/${agent.id}`}>
                                <div className="bg-white rounded-xl border border-cream-200 shadow-sm hover:border-azure-300 hover:shadow-lg hover:shadow-azure-100/50 transition-all cursor-pointer group p-6">
                                    <div className="w-14 h-14 rounded-full overflow-hidden mb-4 shadow-md flex-shrink-0">
                                        {agent.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                                                style={{ background: agent.avatar_color || "var(--color-azure-500)" }}
                                            >
                                                {agent.name[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="font-display font-bold text-lg text-scout-900 group-hover:text-azure-700 transition-colors mb-2">
                                        {agent.name}
                                    </h2>
                                    {agent.description && (
                                        <p className="text-sm text-scout-500 line-clamp-3">{agent.description}</p>
                                    )}
                                    <div className="mt-4 flex items-center gap-1 text-azure-600 text-sm font-medium">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Conversar</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-cream-300 rounded-xl p-16 flex flex-col items-center text-center">
                        <Bot className="w-12 h-12 text-azure-300 mb-4" />
                        <h3 className="font-display font-bold text-scout-800 text-lg mb-2">Nenhum assistente disponível</h3>
                        <p className="text-scout-500 text-sm">Os assistentes IA serão configurados pelo administrador em breve.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
