import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot } from "lucide-react";
import { signout } from "@/app/login/actions";

export default async function AssistantsPage() {
    const supabase = await createClient();
    await supabase.auth.getUser();

    const { data: agents } = await supabase
        .from("agents")
        .select("id, name, description, avatar_color, avatar_url")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col animate-sd-in">
            <nav className="bg-white border-b-2 border-cream-200 sticky top-0 z-30">
                <div className="max-w-[1140px] mx-auto px-6 h-[66px] flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <Image src="/brand/emblema.png" alt="Escoteiros do Brasil" width={32} height={32} className="h-8 w-auto" priority />
                        <span className="font-display font-semibold text-lg text-scout-600">ScoutDoc</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="text-[#45564f]">
                                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Painel
                            </Button>
                        </Link>
                        <form action={signout}>
                            <Button variant="ghost" size="sm" className="text-[#6a7a73]">Sair</Button>
                        </form>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1140px] w-full mx-auto px-6 py-9 flex-1">
                <h1 className="font-display font-semibold text-[34px] text-ink mb-1.5">Assistentes IA</h1>
                <p className="text-[#5a6a63] text-base font-medium mb-8">Convoque um especialista escoteiro movido a IA para a sua próxima reunião.</p>

                {agents && agents.length > 0 ? (
                    <div className="grid gap-[18px] md:grid-cols-2">
                        {agents.map((agent) => (
                            <Link key={agent.id} href={`/assistants/${agent.id}`}>
                                <div className="group bg-white border-[3px] border-ink rounded-[22px] shadow-[5px_5px_0_#16302b] p-6 flex gap-[18px] items-start transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_#16302b]">
                                    <div className="w-16 h-16 flex-shrink-0 rounded-full border-[3px] border-ink overflow-hidden shadow-[3px_3px_0_#16302b] flex items-center justify-center">
                                        {agent.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white font-display font-semibold text-2xl" style={{ background: agent.avatar_color || "#08ba54" }}>
                                                {agent.name[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-display font-semibold text-[11px] text-scout-600 uppercase tracking-[0.08em] mb-0.5">Assistente UEB</div>
                                        <h2 className="font-display font-semibold text-xl text-ink mb-2">{agent.name}</h2>
                                        {agent.description && (
                                            <p className="text-[13.5px] leading-relaxed text-[#5a6a63] font-medium mb-3.5 line-clamp-3">{agent.description}</p>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 font-display font-semibold text-sm text-royal">Conversar →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border-[3px] border-dashed border-cream-300 rounded-[22px] p-16 flex flex-col items-center text-center">
                        <Bot className="w-12 h-12 text-azure-400 mb-4" />
                        <h3 className="font-display font-semibold text-ink text-lg mb-2">Nenhum assistente disponível</h3>
                        <p className="text-[#5a6a63] text-sm font-medium">Os assistentes IA serão configurados pelo administrador em breve.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
