"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Plus, MessageSquare, Loader2, ChevronLeft, Compass } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import CitationBadge, { ReferenceFooter } from "@/components/CitationBadge";
import { parseCitations } from "@/lib/citations";

interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
    pending?: boolean;
}

interface Conversation {
    id: string;
    title: string;
    created_at: string;
}

interface ChatInterfaceProps {
    agentId: string;
    agentName: string;
    agentDescription?: string;
    agentColor: string;
    userEmail?: string;
    conversations: Conversation[];
    welcomeMessage?: string | null;
    suggestions?: string[] | null;
}

const SUGGESTED = [
    "Como funciona a progressão pessoal no escotismo?",
    "Quais são os princípios fundamentais do método escoteiro?",
    "Como organizar uma atividade de campo para escoteiros?",
];

function AssistantContent({ content }: { content: string }) {
    const { segments, references } = parseCitations(content);
    return (
        <div>
            <p className="whitespace-pre-wrap">
                {segments.map((seg, i) =>
                    seg.type === "text" ? (
                        <span key={i}>{seg.value}</span>
                    ) : (
                        <CitationBadge
                            key={i}
                            source={seg.source}
                            index={references.indexOf(seg.source)}
                        />
                    )
                )}
            </p>
            <ReferenceFooter references={references} />
        </div>
    );
}

export default function ChatInterface({
    agentId,
    agentName,
    agentDescription,
    agentColor,
    userEmail,
    conversations: initialConversations,
    welcomeMessage,
    suggestions: agentSuggestions,
}: ChatInterfaceProps) {
    const activeSuggestions = Array.isArray(agentSuggestions) && agentSuggestions.length > 0
        ? agentSuggestions
        : SUGGESTED;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadConversation = useCallback(async (convId: string) => {
        const { data } = await supabase
            .from("messages")
            .select("id, role, content")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: true });
        setMessages(data || []);
        setConversationId(convId);
    }, [supabase]);

    const startNewConversation = () => {
        setMessages([]);
        setConversationId(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const sendMessage = async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || isStreaming) return;

        setInput("");
        setIsStreaming(true);
        setMessages((prev) => [
            ...prev,
            { role: "user", content: msg },
            { role: "assistant", content: "", pending: true },
        ]);

        try {
            const res = await fetch(`/api/chat/${agentId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg, conversationId }),
            });

            if (!res.ok) throw new Error();

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                for (const line of decoder.decode(value).split("\n")) {
                    if (!line.startsWith("data: ")) continue;
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.text) {
                            accumulated += data.text;
                            setMessages((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = { role: "assistant", content: accumulated };
                                return updated;
                            });
                        }
                        if (data.conversationId && !conversationId) {
                            setConversationId(data.conversationId);
                            setConversations((prev) => {
                                if (prev.find((c) => c.id === data.conversationId)) return prev;
                                return [{ id: data.conversationId, title: msg.slice(0, 60), created_at: new Date().toISOString() }, ...prev];
                            });
                        }
                    } catch { /* ignore */ }
                }
            }
        } catch {
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." };
                return updated;
            });
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    };

    const userInitial = userEmail?.[0]?.toUpperCase() ?? "U";

    return (
        <div className="flex flex-1 overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className={cn(
                "flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden",
                sidebarOpen ? "w-64" : "w-0"
            )}
                style={{ background: "oklch(0.15 0.06 145)" }}
            >
                <div className="flex flex-col h-full min-w-64">
                    {/* Sidebar Header */}
                    <div className="px-4 pt-5 pb-3">
                        <Link href="/assistants" className="flex items-center gap-2 mb-5 group">
                            <Compass className="w-4 h-4 text-scout-400 group-hover:text-gold-400 transition-colors" strokeWidth={2} />
                            <span className="text-xs font-semibold text-scout-400 group-hover:text-gold-400 transition-colors uppercase tracking-widest">
                                Assistentes
                            </span>
                        </Link>

                        <button
                            onClick={startNewConversation}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group"
                            style={{ background: "oklch(0.22 0.08 145)", color: "oklch(0.90 0.06 80)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.28 0.10 80)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.22 0.08 145)")}
                        >
                            <Plus className="w-4 h-4" />
                            Nova Conversa
                        </button>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto px-2 pb-4">
                        {conversations.length > 0 ? (
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-widest px-2 mb-2"
                                    style={{ color: "oklch(0.45 0.05 145)" }}>
                                    Conversas
                                </p>
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => loadConversation(conv.id)}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-150 group",
                                            conversationId === conv.id
                                                ? "text-white font-medium"
                                                : "hover:text-white font-normal"
                                        )}
                                        style={{
                                            background: conversationId === conv.id ? "oklch(0.25 0.09 145)" : "transparent",
                                            color: conversationId === conv.id ? "white" : "oklch(0.60 0.05 145)",
                                        }}
                                        onMouseEnter={e => {
                                            if (conversationId !== conv.id) {
                                                e.currentTarget.style.background = "oklch(0.20 0.07 145)";
                                                e.currentTarget.style.color = "white";
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (conversationId !== conv.id) {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.color = "oklch(0.60 0.05 145)";
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
                                            <div className="min-w-0">
                                                <p className="truncate leading-snug">{conv.title}</p>
                                                <p className="text-[10px] mt-0.5 opacity-50">
                                                    {new Date(conv.created_at).toLocaleDateString("pt-BR")}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-center mt-6 px-4 leading-relaxed"
                                style={{ color: "oklch(0.45 0.05 145)" }}>
                                Nenhuma conversa ainda.<br />Comece uma nova pergunta.
                            </p>
                        )}
                    </div>

                    {/* Agent info at bottom */}
                    <div className="px-4 py-3 border-t" style={{ borderColor: "oklch(0.22 0.06 145)" }}>
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ring-2 ring-white/10"
                                style={{ background: agentColor }}
                            >
                                {agentName[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold truncate text-white">{agentName}</p>
                                <p className="text-[10px]" style={{ color: "oklch(0.50 0.05 145)" }}>Assistente UEB</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Chat ── */}
            <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "oklch(0.98 0.01 100)" }}>

                {/* Top bar inside chat */}
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-white flex-shrink-0"
                    style={{ borderColor: "oklch(0.92 0.02 100)" }}>
                    <button
                        onClick={() => setSidebarOpen((o) => !o)}
                        className="p-1.5 rounded-lg hover:bg-cream-100 text-scout-500 transition-colors"
                    >
                        <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
                    </button>
                    <div className="h-5 w-px bg-cream-200" />
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                        style={{ background: agentColor }}
                    >
                        {agentName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-scout-900 text-sm leading-tight truncate">{agentName}</p>
                        {agentDescription && (
                            <p className="text-xs text-scout-400 truncate">{agentDescription}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: "oklch(0.94 0.06 145)", color: "oklch(0.38 0.17 145)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-scout-500 animate-pulse" />
                        Online
                    </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                            <div className="mb-6 relative">
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl"
                                    style={{ background: `linear-gradient(135deg, ${agentColor}, oklch(0.48 0.20 240))` }}
                                >
                                    {agentName[0].toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-scout-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                    <span className="text-white text-[10px]">✓</span>
                                </div>
                            </div>
                            <h2 className="font-display font-bold text-scout-900 text-2xl mb-2">{agentName}</h2>
                            {welcomeMessage ? (
                                <p className="text-scout-600 text-sm mb-8 max-w-xs leading-relaxed">{welcomeMessage}</p>
                            ) : agentDescription ? (
                                <p className="text-scout-500 text-sm mb-8 max-w-xs leading-relaxed">{agentDescription}</p>
                            ) : null}
                            <p className="text-xs text-scout-400 font-semibold uppercase tracking-widest mb-3">
                                Sugestões para começar
                            </p>
                            <div className="flex flex-col gap-2 w-full max-w-sm">
                                {activeSuggestions.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => sendMessage(s)}
                                        className="text-left text-sm px-4 py-3 rounded-xl border bg-white hover:border-scout-400 hover:bg-scout-50 hover:text-scout-800 transition-all duration-150 text-scout-600 font-medium shadow-sm"
                                        style={{ borderColor: "oklch(0.88 0.03 100)" }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>

                                    {/* Assistant avatar */}
                                    {msg.role === "assistant" && (
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5 shadow-sm"
                                            style={{ background: agentColor }}
                                        >
                                            {agentName[0].toUpperCase()}
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    {msg.pending ? (
                                        <div className="flex items-center gap-1.5 px-5 py-4 bg-white rounded-2xl rounded-tl-sm border shadow-sm"
                                            style={{ borderColor: "oklch(0.90 0.02 100)" }}>
                                            {[0, 150, 300].map((delay) => (
                                                <span
                                                    key={delay}
                                                    className="w-2 h-2 rounded-full animate-bounce"
                                                    style={{ background: agentColor, animationDelay: `${delay}ms` }}
                                                />
                                            ))}
                                        </div>
                                    ) : msg.role === "user" ? (
                                        <div
                                            className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white font-medium shadow-sm"
                                            style={{ background: "oklch(0.38 0.17 145)" }}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    ) : (
                                        <div
                                            className="max-w-[72%] px-5 py-4 bg-white rounded-2xl rounded-tl-sm border text-sm leading-relaxed text-scout-800 shadow-sm"
                                            style={{
                                                borderColor: "oklch(0.90 0.02 100)",
                                                borderLeftWidth: "3px",
                                                borderLeftColor: agentColor,
                                            }}
                                        >
                                            <AssistantContent content={msg.content} />
                                        </div>
                                    )}

                                    {/* User avatar */}
                                    {msg.role === "user" && (
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm"
                                            style={{ background: "oklch(0.28 0.14 145)" }}
                                        >
                                            {userInitial}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className="flex-shrink-0 px-4 py-4 bg-white border-t" style={{ borderColor: "oklch(0.92 0.02 100)" }}>
                    <div className="max-w-3xl mx-auto">
                        <div
                            className="flex items-end gap-3 bg-white rounded-2xl border px-4 py-3 shadow-sm focus-within:border-scout-400 focus-within:shadow-md transition-all duration-200"
                            style={{ borderColor: "oklch(0.85 0.03 100)" }}
                        >
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Faça sua pergunta sobre metodologia escoteira…"
                                rows={1}
                                disabled={isStreaming}
                                className="flex-1 bg-transparent text-sm text-scout-800 placeholder-scout-400 resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
                                style={{ maxHeight: "120px" }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={isStreaming || !input.trim()}
                                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: isStreaming || !input.trim() ? "oklch(0.75 0.05 145)" : "oklch(0.38 0.17 145)" }}
                            >
                                {isStreaming
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Send className="w-4 h-4" />
                                }
                            </button>
                        </div>
                        <p className="text-center text-[11px] text-scout-400 mt-2.5">
                            As respostas são geradas por IA e podem conter imprecisões.
                            Sempre consulte os documentos oficiais da UEB.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
