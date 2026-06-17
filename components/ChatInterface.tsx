"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { Send, Plus, MessageSquare, Loader2, ChevronLeft, FileDown, Paperclip, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import MarkdownMessage from "@/components/MarkdownMessage";
import PreviewModal from "@/components/PreviewModal";
import { formatPreviewContent } from "@/lib/document-template";
import type { DocumentTemplate } from "@/lib/document-template";
import AgentAvatar from "@/components/AgentAvatar";
import UserAvatar from "@/components/UserAvatar";
import { validateImageFile, MAX_CHAT_IMAGE_SIZE } from "@/lib/imageValidation";

interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
    imageUrl?: string | null;
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
    agentAvatarUrl?: string | null;
    userEmail?: string;
    userAvatarUrl?: string | null;
    conversations: Conversation[];
    welcomeMessage?: string | null;
    suggestions?: string[] | null;
    producesDocument?: boolean;
    documentTemplate?: DocumentTemplate | null;
    documentTitle?: string | null;
}

const SUGGESTED = [
    "Como funciona a progressão pessoal no escotismo?",
    "Quais são os princípios fundamentais do método escoteiro?",
    "Como organizar uma atividade de campo para escoteiros?",
];

function AssistantContent({ content }: { content: string }) {
    return <MarkdownMessage content={content} />;
}

export default function ChatInterface({
    agentId,
    agentName,
    agentDescription,
    agentColor,
    agentAvatarUrl,
    userEmail,
    userAvatarUrl,
    conversations: initialConversations,
    welcomeMessage,
    suggestions: agentSuggestions,
    producesDocument,
    documentTemplate,
    documentTitle,
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Document generation state (impl. 004)
    const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
    const [docPreviewOpen, setDocPreviewOpen] = useState(false);
    const [docPreviewContent, setDocPreviewContent] = useState<string | null>(null);
    const [docPreviewTitle, setDocPreviewTitle] = useState("");
    const [docPreviewData, setDocPreviewData] = useState<any>(null);
    const [docGenerateError, setDocGenerateError] = useState<string | null>(null);

    // Image attachment state (impl. 006)
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const clearSelectedImage = useCallback(() => {
        setSelectedImage(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [imagePreviewUrl]);

    const loadConversation = useCallback(async (convId: string) => {
        const { data } = await supabase
            .from("messages")
            .select("id, role, content, image_url")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: true });
        setMessages((data || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            imageUrl: m.image_url ?? null,
        })));
        setConversationId(convId);
    }, [supabase]);

    const startNewConversation = () => {
        setMessages([]);
        setConversationId(null);
        clearSelectedImage();
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleGenerateDocument = async () => {
        if (!conversationId || isGeneratingDoc || isStreaming) return;
        setIsGeneratingDoc(true);
        setDocGenerateError(null);

        try {
            const res = await fetch(`/api/chat/${agentId}/document`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, preview: true }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao gerar documento");
            }

            const preview = await res.json();
            const previewTitle = preview.title || documentTitle || agentName;
            const previewContent = documentTemplate
                ? formatPreviewContent(preview, documentTemplate)
                : preview.content || "(sem conteúdo)";

            setDocPreviewTitle(previewTitle);
            setDocPreviewContent(previewContent);
            setDocPreviewData(preview);
            setDocPreviewOpen(true);
        } catch (err: any) {
            setDocGenerateError(err.message);
        } finally {
            setIsGeneratingDoc(false);
        }
    };

    const handleDocDownload = async (format: "docx" | "pdf") => {
        if (!conversationId) return;
        const res = await fetch(`/api/chat/${agentId}/document`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, format, preview: false }),
        });
        if (!res.ok) throw new Error("Falha ao baixar arquivo");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const name = (documentTitle || docPreviewTitle || agentName).replace(/[^a-z0-9]/gi, "_").toLowerCase();
        a.download = `${name}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validationError = validateImageFile(file, MAX_CHAT_IMAGE_SIZE);
        if (validationError) {
            setImageUploadError(validationError);
            return;
        }

        setImageUploadError(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setSelectedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
    };

    const sendMessage = async (text?: string) => {
        const msg = (text ?? input).trim();
        if ((!msg && !selectedImage) || isStreaming) return;

        let uploadedImageUrl: string | null = null;

        if (selectedImage) {
            setIsUploadingImage(true);
            try {
                const urlRes = await fetch(`/api/chat/${agentId}/upload-url`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: selectedImage.name, contentType: selectedImage.type }),
                });
                if (!urlRes.ok) {
                    const err = await urlRes.json();
                    throw new Error(err.error || "Erro ao obter URL de upload");
                }
                const { signedUrl, publicUrl } = await urlRes.json();

                const uploadRes = await fetch(signedUrl, {
                    method: "PUT",
                    body: selectedImage,
                    headers: { "Content-Type": selectedImage.type },
                });
                if (!uploadRes.ok) throw new Error("Falha no upload da imagem");

                uploadedImageUrl = publicUrl;
            } catch (err: any) {
                setImageUploadError(err.message ?? "Erro ao enviar imagem");
                setIsUploadingImage(false);
                return;
            }
            setIsUploadingImage(false);
            clearSelectedImage();
        }

        setInput("");
        setIsStreaming(true);
        setMessages((prev) => [
            ...prev,
            { role: "user", content: msg, imageUrl: uploadedImageUrl },
            { role: "assistant", content: "", pending: true },
        ]);

        try {
            const res = await fetch(`/api/chat/${agentId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg, conversationId, imageUrl: uploadedImageUrl }),
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
                                return [{ id: data.conversationId, title: msg.slice(0, 60) || "Conversa com imagem", created_at: new Date().toISOString() }, ...prev];
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

    const userBubble: CSSProperties = { borderRadius: "16px 16px 5px 16px" };
    const botBubble: CSSProperties = { borderRadius: "16px 16px 16px 5px" };

    return (
        <>
        <div className="flex flex-1 overflow-hidden bg-cream-100">

            {/* ── Sidebar ── */}
            <aside className={cn(
                "flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden bg-ink",
                sidebarOpen ? "w-64" : "w-0"
            )}>
                <div className="flex flex-col h-full min-w-64">
                    {/* Sidebar Header */}
                    <div className="px-4 pt-5 pb-3">
                        <Link href="/assistants" className="flex items-center gap-2 mb-5 group">
                            <ChevronLeft className="w-4 h-4 text-lime group-hover:text-white transition-colors" strokeWidth={2.5} />
                            <span className="text-xs font-display font-semibold text-lime group-hover:text-white transition-colors uppercase tracking-widest">
                                Assistentes
                            </span>
                        </Link>

                        <button
                            onClick={startNewConversation}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] text-sm font-display font-semibold bg-lime text-ink border-[2.5px] border-ink shadow-[2px_2px_0_#0a3a2b] transition-all hover:-translate-y-px"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Conversa
                        </button>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto sd-scroll px-2 pb-4">
                        {conversations.length > 0 ? (
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-widest px-2 mb-2 text-white/40 font-semibold">
                                    Conversas
                                </p>
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => loadConversation(conv.id)}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-[10px] text-xs transition-all duration-150",
                                            conversationId === conv.id
                                                ? "bg-white/15 text-white font-medium"
                                                : "text-white/55 hover:bg-white/10 hover:text-white font-normal"
                                        )}
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
                            <p className="text-xs text-center mt-6 px-4 leading-relaxed text-white/40">
                                Nenhuma conversa ainda.<br />Comece uma nova pergunta.
                            </p>
                        )}
                    </div>

                    {/* Agent info at bottom */}
                    <div className="px-4 py-3 border-t border-white/10">
                        <div className="flex items-center gap-2.5">
                            <AgentAvatar
                                name={agentName}
                                avatarColor={agentColor}
                                avatarUrl={agentAvatarUrl}
                                size={28}
                                className="ring-2 ring-white/15"
                            />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold truncate text-white">{agentName}</p>
                                <p className="text-[10px] text-white/45">Assistente UEB</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Chat ── */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-cream-100">

                {/* Top bar inside chat */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b-2 border-cream-200 bg-white flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen((o) => !o)}
                        className="p-1.5 rounded-[10px] hover:bg-cream-100 text-[#45564f] transition-colors"
                    >
                        <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
                    </button>
                    <div className="h-5 w-px bg-cream-300" />
                    <AgentAvatar
                        name={agentName}
                        avatarColor={agentColor}
                        avatarUrl={agentAvatarUrl}
                        size={40}
                        className="border-[2.5px] border-ink"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-ink text-[15px] leading-tight truncate">{agentName}</p>
                        <p className="text-xs text-scout-600 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-scout-600 animate-pulse" />
                            Online{agentDescription ? ` · ${agentDescription}` : ""}
                        </p>
                    </div>

                    {producesDocument && (
                        <button
                            onClick={handleGenerateDocument}
                            disabled={!conversationId || messages.length === 0 || isStreaming || isGeneratingDoc}
                            title="Gerar documento estruturado com base na conversa"
                            className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-2 rounded-[12px] border-[2.5px] border-ink bg-royal-50 text-royal transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {isGeneratingDoc
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <FileDown className="w-3.5 h-3.5" />
                            }
                            Gerar documento
                        </button>
                    )}
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto sd-scroll">
                    {messages.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                            <div className="mb-6 relative">
                                <AgentAvatar
                                    name={agentName}
                                    avatarColor={agentColor}
                                    avatarUrl={agentAvatarUrl}
                                    size={80}
                                    rounded="2xl"
                                    className="border-[3px] border-ink shadow-[5px_5px_0_#16302b]"
                                />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-scout-600 rounded-full flex items-center justify-center border-[2.5px] border-ink">
                                    <span className="text-white text-[10px]">✓</span>
                                </div>
                            </div>
                            <h2 className="font-display font-semibold text-ink text-2xl mb-2">{agentName}</h2>
                            {welcomeMessage ? (
                                <p className="text-[#5a6a63] text-sm mb-8 max-w-sm leading-relaxed font-medium">{welcomeMessage}</p>
                            ) : agentDescription ? (
                                <p className="text-[#6a7a73] text-sm mb-8 max-w-sm leading-relaxed font-medium">{agentDescription}</p>
                            ) : null}
                            <p className="text-xs text-[#8a9a93] font-display font-semibold uppercase tracking-widest mb-3">
                                Sugestões para começar
                            </p>
                            <div className="flex flex-col gap-2 w-full max-w-sm">
                                {activeSuggestions.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => sendMessage(s)}
                                        className="text-left text-sm px-4 py-3 rounded-[14px] border-[2.5px] border-ink bg-white hover:bg-[#f1f7e4] transition-colors text-ink font-medium"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn("flex gap-2.5 items-end", msg.role === "user" ? "justify-end" : "justify-start")}>

                                    {/* Assistant avatar */}
                                    {msg.role === "assistant" && (
                                        <AgentAvatar
                                            name={agentName}
                                            avatarColor={agentColor}
                                            avatarUrl={agentAvatarUrl}
                                            size={36}
                                            className="border-[2.5px] border-ink"
                                        />
                                    )}

                                    {/* Bubble */}
                                    {msg.pending ? (
                                        <div className="flex items-center gap-1.5 px-5 py-4 bg-white rounded-2xl border-[2.5px] border-ink shadow-[2px_3px_0_#16302b]" style={botBubble}>
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
                                            className="max-w-[78%] px-4 py-3 text-sm leading-relaxed text-white font-medium bg-scout-600 border-[2.5px] border-ink shadow-[2px_3px_0_#16302b]"
                                            style={userBubble}
                                        >
                                            {msg.imageUrl && (
                                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Imagem anexada"
                                                        className="max-w-full max-h-48 rounded-lg object-cover"
                                                    />
                                                </a>
                                            )}
                                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                        </div>
                                    ) : (
                                        <div
                                            className="max-w-[78%] px-5 py-4 bg-white border-[2.5px] border-ink text-sm leading-relaxed text-scout-800 shadow-[2px_3px_0_#16302b]"
                                            style={botBubble}
                                        >
                                            <AssistantContent content={msg.content} />
                                        </div>
                                    )}

                                    {/* User avatar */}
                                    {msg.role === "user" && (
                                        <UserAvatar
                                            avatarUrl={userAvatarUrl}
                                            email={userEmail}
                                            size={36}
                                            className="border-[2.5px] border-ink"
                                        />
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Error banners */}
                {docGenerateError && (
                    <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t-2 border-red-200 flex items-center justify-between">
                        <p className="text-xs text-red-700 font-medium">{docGenerateError}</p>
                        <button onClick={() => setDocGenerateError(null)} className="text-red-500 hover:text-red-700 text-xs ml-3">✕</button>
                    </div>
                )}
                {imageUploadError && (
                    <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t-2 border-red-200 flex items-center justify-between">
                        <p className="text-xs text-red-700 font-medium">{imageUploadError}</p>
                        <button onClick={() => setImageUploadError(null)} className="text-red-500 hover:text-red-700 text-xs ml-3">✕</button>
                    </div>
                )}

                {/* Image preview strip */}
                {imagePreviewUrl && (
                    <div className="flex-shrink-0 px-4 pt-3 bg-cream-100">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative inline-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagePreviewUrl}
                                    alt="Imagem selecionada"
                                    className="h-20 w-20 object-cover rounded-[12px] border-[2.5px] border-ink"
                                />
                                <button
                                    onClick={clearSelectedImage}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border-2 border-ink rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                                    aria-label="Remover imagem"
                                >
                                    <X className="w-3 h-3 text-ink" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input area */}
                <div className="flex-shrink-0 px-4 py-4 bg-cream-100">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-end gap-2 bg-cream-50 rounded-[16px] border-[2.5px] border-ink px-3 py-2.5 transition-colors focus-within:border-azure-500">
                            {/* Attachment button */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isStreaming || isUploadingImage}
                                className="flex-shrink-0 p-1.5 text-[#6a7a73] hover:text-ink hover:bg-cream-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Anexar imagem"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>

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
                                placeholder="Pergunte ao assistente..."
                                rows={1}
                                disabled={isStreaming || isUploadingImage}
                                className="flex-1 bg-transparent text-sm text-scout-800 placeholder-[#8aa39a] resize-none focus:outline-none disabled:opacity-50 leading-relaxed font-medium py-1.5"
                                style={{ maxHeight: "120px" }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={isStreaming || isUploadingImage || (!input.trim() && !selectedImage)}
                                className="flex-shrink-0 w-10 h-10 rounded-[12px] flex items-center justify-center text-white bg-scout-600 border-[2.5px] border-ink transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {isStreaming || isUploadingImage
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Send className="w-4 h-4" />
                                }
                            </button>
                        </div>
                        <p className="text-center text-[10.5px] text-[#8a9a93] mt-2.5 font-semibold">
                            Respostas baseadas em POR · PNAME · Matriz de Formação
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Document preview modal (impl. 004) */}
        <PreviewModal
            isOpen={docPreviewOpen}
            onClose={() => setDocPreviewOpen(false)}
            title={docPreviewTitle}
            content={docPreviewContent}
            data={docPreviewData}
            downloadHandler={handleDocDownload}
        />
        </>
    );
}
