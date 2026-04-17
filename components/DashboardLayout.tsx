"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Compass, Bot, FileText, Plus, Search, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signout } from "@/app/login/actions";
import DashboardClient from "@/components/DashboardClient";

interface Agent {
    id: string;
    name: string;
    description?: string | null;
    avatar_color?: string | null;
}

interface DashboardLayoutProps {
    firstName: string;
    userEmail: string;
    documents: any[];
    agents: Agent[];
}

export default function DashboardLayout({ firstName, userEmail, documents, agents }: DashboardLayoutProps) {
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <div className="min-h-screen font-body" style={{ background: "oklch(0.97 0.01 100)" }}>

            {/* ══════════ DARK HERO ══════════ */}
            <div
                className="relative"
                style={{
                    background: "linear-gradient(135deg, oklch(0.13 0.06 145) 0%, oklch(0.15 0.07 220) 100%)",
                    borderRadius: "0 0 40px 40px",
                    paddingBottom: "40px",
                }}
            >
                {/* Compass watermark */}
                <Compass
                    className="absolute right-4 top-1/2 -translate-y-1/2 rotate-12 pointer-events-none select-none"
                    style={{ width: 380, height: 380, color: "white", opacity: 0.05 }}
                    strokeWidth={1}
                />

                {/* ── Nav overlay ── */}
                <nav className="relative z-10 flex items-center justify-between px-6 h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <Compass className="w-5 h-5 text-white/70" strokeWidth={2} />
                        <span className="font-display font-bold text-white text-lg">
                            ScoutDoc<span className="text-gold-400">.AI</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-semibold text-white/80">{userEmail}</span>
                            <span className="text-[10px] text-white/40">UEB Account</span>
                        </div>
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 shadow"
                            style={{ background: "oklch(0.38 0.17 145)" }}
                        >
                            {userEmail[0].toUpperCase()}
                        </div>
                        <form action={signout}>
                            <button className="text-xs text-white/50 hover:text-white/90 transition-colors px-2 py-1">
                                Sair
                            </button>
                        </form>
                    </div>
                </nav>

                {/* ── Greeting ── */}
                <motion.div
                    className="relative z-10 px-6 pt-6 pb-16"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <p className="text-white/50 text-sm mb-1">Bem-vindo de volta,</p>
                    <h1 className="font-display font-bold text-white text-4xl md:text-5xl mb-4">
                        Olá, {firstName} 👋
                    </h1>

                    {/* Gold date pill */}
                    <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-5"
                        style={{
                            background: "oklch(0.74 0.20 80 / 0.15)",
                            color: "oklch(0.82 0.16 80)",
                            border: "1px solid oklch(0.74 0.20 80 / 0.30)",
                        }}
                    >
                        📅 {today}
                    </span>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-2 text-sm text-white/60">
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: "oklch(0.59 0.16 145)" }}
                            />
                            {documents.length} PUD{documents.length !== 1 ? "s" : ""} criado{documents.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="flex items-center gap-2 text-sm text-white/60">
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: "oklch(0.48 0.20 240)", animationDelay: "0.5s" }}
                            />
                            {agents.length} assistente{agents.length !== 1 ? "s" : ""} disponível{agents.length !== 1 ? "is" : ""}
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* ══════════ BENTO GRID ══════════ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pb-12 relative z-10">
                <div className="grid grid-cols-12 gap-5">

                    {/* ── Assistentes IA (col 7) ── */}
                    <motion.div
                        className="col-span-12 lg:col-span-7 bg-white rounded-2xl shadow-xl overflow-hidden"
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.2 }}
                    >
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: "oklch(0.93 0.05 240)" }}
                                    >
                                        <Bot className="w-4 h-4" style={{ color: "oklch(0.48 0.20 240)" }} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "oklch(0.59 0.05 145)" }}>
                                            Assistentes IA
                                        </p>
                                        <p className="text-[11px]" style={{ color: "oklch(0.68 0.04 145)" }}>
                                            Especialistas escoteiros disponíveis
                                        </p>
                                    </div>
                                </div>
                                {agents.length > 0 && (
                                    <Link href="/assistants" className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "oklch(0.48 0.20 240)" }}>
                                        Ver todos <ArrowRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>

                            {agents.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                                    {agents.map((agent, index) => (
                                        <motion.div
                                            key={agent.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.35, delay: 0.3 + index * 0.06 }}
                                        >
                                            <Link href={`/assistants/${agent.id}`}>
                                                <div
                                                    className="w-44 flex-shrink-0 rounded-xl p-4 flex flex-col gap-2.5 cursor-pointer group transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
                                                    style={{
                                                        background: agent.avatar_color || "linear-gradient(145deg, oklch(0.38 0.17 145) 0%, oklch(0.20 0.08 145) 100%)",
                                                        minHeight: "200px",
                                                    }}
                                                >
                                                    <div
                                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                                                        style={{
                                                            background: "rgba(255,255,255,0.15)",
                                                            border: "2px solid rgba(255,255,255,0.25)",
                                                        }}
                                                    >
                                                        {agent.name[0].toUpperCase()}
                                                    </div>
                                                    <p className="text-white font-bold text-sm leading-tight">
                                                        {agent.name}
                                                    </p>
                                                    {agent.description && (
                                                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                                                            {agent.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-auto">
                                                        <span
                                                            className="inline-flex items-center gap-1.5 text-white text-xs rounded-lg px-3 py-1.5 w-full justify-center transition-all duration-150 group-hover:bg-white/25"
                                                            style={{
                                                                background: "rgba(255,255,255,0.12)",
                                                                border: "1px solid rgba(255,255,255,0.20)",
                                                            }}
                                                        >
                                                            <MessageSquare className="w-3 h-3" /> Conversar
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Bot className="w-10 h-10 mb-3" style={{ color: "oklch(0.80 0.03 145)" }} />
                                    <p className="text-sm font-medium" style={{ color: "oklch(0.55 0.05 145)" }}>
                                        Nenhum assistente disponível ainda.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Novo PUD CTA (col 5) ── */}
                    <motion.div
                        className="col-span-12 lg:col-span-5 rounded-2xl shadow-xl overflow-hidden relative"
                        style={{ background: "linear-gradient(135deg, oklch(0.38 0.17 145) 0%, oklch(0.38 0.18 240) 100%)" }}
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.28 }}
                    >
                        {/* Decorative icon */}
                        <FileText
                            className="absolute -bottom-8 -right-8 pointer-events-none select-none"
                            style={{ width: 180, height: 180, color: "rgba(255,255,255,0.07)" }}
                            strokeWidth={1}
                        />

                        <div className="relative z-10 p-6 flex flex-col h-full" style={{ minHeight: "240px" }}>
                            <span
                                className="self-start text-[10px] font-bold uppercase tracking-widest mb-3 px-2.5 py-1 rounded-full"
                                style={{
                                    background: "oklch(0.74 0.20 80 / 0.20)",
                                    color: "oklch(0.82 0.16 80)",
                                    border: "1px solid oklch(0.74 0.20 80 / 0.35)",
                                }}
                            >
                                Gerador de PUD
                            </span>

                            <h2 className="font-display font-bold text-white text-xl leading-snug mb-2">
                                Crie o plano da sua próxima atividade
                            </h2>
                            <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                                Preencha o formulário e a IA gera o documento completo em segundos.
                            </p>

                            <div className="mt-auto flex items-center justify-between">
                                <Link href="/pud/new">
                                    <Button variant="gold" size="lg" className="shadow-lg">
                                        <Plus className="w-4 h-4 mr-2" /> Criar Novo PUD
                                    </Button>
                                </Link>
                                {documents.length > 0 && (
                                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                                        {documents.length} doc{documents.length !== 1 ? "s" : ""} gerado{documents.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Documentos (col 12) ── */}
                    <motion.div
                        className="col-span-12 bg-white rounded-2xl shadow-xl"
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.36 }}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: "oklch(0.92 0.05 145)" }}
                                    >
                                        <FileText className="w-4 h-4" style={{ color: "oklch(0.38 0.17 145)" }} />
                                    </div>
                                    <div>
                                        <p className="font-display font-bold text-sm" style={{ color: "oklch(0.20 0.10 145)" }}>
                                            Meus Documentos
                                        </p>
                                        <p className="text-[11px]" style={{ color: "oklch(0.55 0.05 145)" }}>
                                            {documents.length} documento{documents.length !== 1 ? "s" : ""} criado{documents.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <DashboardClient documents={documents} />
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
