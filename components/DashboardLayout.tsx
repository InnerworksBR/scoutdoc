"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageSquare, BookOpen, Users } from "lucide-react";
import { signout } from "@/app/login/actions";
import DashboardClient from "@/components/DashboardClient";
import UserAvatar from "@/components/UserAvatar";

interface Agent {
    id: string;
    name: string;
    description?: string | null;
    avatar_color?: string | null;
}

interface DashboardLayoutProps {
    firstName: string;
    userEmail: string;
    userAvatarUrl?: string | null;
    documents: any[];
    agents: Agent[];
}

const TINTS = ["#d8f5e3", "#d6eefb", "#fff2b8", "#e6ecfd"];

export default function DashboardLayout({ firstName, userEmail, userAvatarUrl, documents, agents }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-cream-100 animate-sd-in">

            {/* ══════════ HERO ══════════ */}
            <div className="relative overflow-hidden bg-scout-gradient pb-[70px]">
                <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                    <path d="M-60,120 C240,40 520,200 760,120 S1120,40 1320,150" fill="none" stroke="#ffffff" strokeWidth="30" strokeLinecap="round" opacity="0.1" />
                    <path d="M-60,300 C240,380 520,240 760,320 S1120,380 1320,280" fill="none" stroke="#b0dd43" strokeWidth="26" strokeLinecap="round" opacity="0.16" />
                </svg>

                <div className="relative z-[2] max-w-[1140px] mx-auto px-6">
                    {/* nav */}
                    <div className="h-[66px] flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2.5">
                            <Image src="/brand/emblema.png" alt="Escoteiros do Brasil" width={34} height={34} className="h-[34px] w-auto" priority />
                            <span className="font-display font-semibold text-[19px] text-white">ScoutDoc</span>
                        </Link>
                        <div className="flex items-center gap-3.5">
                            <div className="hidden sm:block text-right leading-tight">
                                <div className="text-xs font-bold text-white">{userEmail}</div>
                                <div className="text-[10px] text-[#dff3e6] font-semibold">Conta UEB</div>
                            </div>
                            <Link href="/profile" title="Editar perfil">
                                <UserAvatar avatarUrl={userAvatarUrl} email={userEmail} size={38} className="border-[2.5px] border-ink" />
                            </Link>
                            <form action={signout}>
                                <button className="text-xs text-[#e3f6ea] hover:text-white font-semibold">Sair</button>
                            </form>
                        </div>
                    </div>

                    {/* greeting */}
                    <div className="pt-7">
                        <p className="text-[#e3f6ea] text-[15px] font-semibold mb-1">Bem-vindo de volta, Chefe</p>
                        <h1 className="font-display font-semibold text-white text-[40px] md:text-[44px] tracking-tight">Olá, {firstName}!</h1>
                        <div className="flex gap-2.5 mt-4 flex-wrap">
                            <span className="inline-flex items-center gap-2 bg-white/15 border-2 border-white/30 text-white rounded-full px-3.5 py-1.5 text-xs font-bold">
                                <BookOpen className="w-[15px] h-[15px]" /> {documents.length} PUD{documents.length !== 1 ? "s" : ""} criado{documents.length !== 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-2 bg-white/15 border-2 border-white/30 text-white rounded-full px-3.5 py-1.5 text-xs font-bold">
                                <Users className="w-[15px] h-[15px]" /> {agents.length} assistente{agents.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ CONTENT ══════════ */}
            <div className="max-w-[1140px] mx-auto px-6 -mt-11 pb-16 relative z-[3]">

                {/* CTA novo PUD */}
                <Link href="/pud/new">
                    <div className="group relative overflow-hidden bg-white border-[3px] border-ink rounded-[24px] shadow-[6px_6px_0_#16302b] p-7 flex items-center gap-6 transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[7px_7px_0_#16302b]">
                        <div className="w-[70px] h-[70px] flex-shrink-0 rounded-[20px] bg-scout-600 border-[3px] border-ink flex items-center justify-center text-white font-display font-semibold text-[38px] leading-none">+</div>
                        <div className="flex-1 min-w-0">
                            <div className="font-display font-semibold text-xs text-scout-600 uppercase tracking-[0.1em]">Gerador de PUD</div>
                            <h2 className="font-display font-semibold text-2xl text-ink mt-1 mb-1">Planejar uma nova atividade</h2>
                            <p className="text-sm text-[#5a6a63] font-medium">Quatro passos e a IA monta o documento completo, citando POR e Matriz de Formação.</p>
                        </div>
                        <span className="flex-shrink-0 bg-gold-500 text-ink border-[2.5px] border-ink rounded-[13px] px-5 py-3 font-display font-semibold text-[15px] shadow-[3px_3px_0_#16302b]">Criar →</span>
                    </div>
                </Link>

                {/* Assistentes */}
                <div className="flex items-center justify-between mt-8 mb-3.5 mx-1">
                    <h3 className="font-display font-semibold text-xl text-ink">Assistentes IA</h3>
                    <Link href="/assistants" className="text-[13px] font-bold text-royal hover:underline">Ver todos →</Link>
                </div>
                {agents.length > 0 ? (
                    <div className="sd-scroll flex gap-4 overflow-x-auto pb-2.5">
                        {agents.map((agent, i) => (
                            <Link key={agent.id} href={`/assistants/${agent.id}`} className="flex-shrink-0">
                                <div className="w-[200px] h-full bg-white border-[3px] border-ink rounded-[20px] shadow-[4px_4px_0_#16302b] p-[18px] flex flex-col gap-2.5 transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#16302b]">
                                    <div className="w-[52px] h-[52px] rounded-full border-[2.5px] border-ink flex items-center justify-center text-white font-display font-semibold text-2xl shadow-[2px_2px_0_#16302b]" style={{ background: agent.avatar_color || "#08ba54" }}>
                                        {agent.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="font-display font-semibold text-base leading-tight text-ink">{agent.name}</div>
                                    <div className="text-xs leading-snug text-[#5a6a63] font-medium min-h-[52px] line-clamp-3">{agent.description || "Assistente escoteiro movido a IA."}</div>
                                    <div className="mt-auto border-2 border-ink rounded-[11px] py-2 text-center font-display font-semibold text-[13px] text-ink" style={{ background: TINTS[i % TINTS.length] }}>Conversar</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border-[3px] border-dashed border-cream-300 rounded-[20px] p-10 flex flex-col items-center text-center">
                        <MessageSquare className="w-9 h-9 text-azure-400 mb-3" />
                        <p className="text-sm font-medium text-[#5a6a63]">Nenhum assistente disponível ainda.</p>
                    </div>
                )}

                {/* Documentos */}
                <div className="flex items-center justify-between mt-8 mb-3.5 mx-1">
                    <h3 className="font-display font-semibold text-xl text-ink">Meus Documentos</h3>
                    <span className="text-xs text-[#6a7a73] font-semibold">{documents.length} criado{documents.length !== 1 ? "s" : ""}</span>
                </div>
                <DashboardClient documents={documents} />
            </div>
        </div>
    );
}
