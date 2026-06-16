"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, Trash2, Plus, X, FileText, ChevronDown } from "lucide-react";
import type { DocumentSection, SectionType } from "@/lib/document-template";

const AVATAR_COLORS = [
    "linear-gradient(135deg, #38a169, #3b82f6)",  // Verde → Azul (padrão)
    "linear-gradient(135deg, #3b82f6, #8b5cf6)",  // Azul → Roxo
    "linear-gradient(135deg, #f59e0b, #ef4444)",  // Dourado → Vermelho
    "linear-gradient(135deg, #10b981, #06b6d4)",  // Esmeralda → Ciano
    "linear-gradient(135deg, #8b5cf6, #ec4899)",  // Roxo → Rosa
    "linear-gradient(135deg, #f97316, #eab308)",  // Laranja → Amarelo
];

interface AgentFormProps {
    agent?: {
        id: string;
        name: string;
        description?: string;
        system_prompt: string;
        avatar_color: string;
        is_active: boolean;
        welcome_message?: string | null;
        suggestions?: string[] | null;
        produces_document?: boolean;
        document_title?: string | null;
        document_template?: { title?: string; sections: DocumentSection[] } | null;
    };
}

const EMPTY_SECTION: { key: string; label: string; instruction: string; type: SectionType; columnsRaw: string } = {
    key: "",
    label: "",
    instruction: "",
    type: "texto",
    columnsRaw: "",
};

export default function AgentForm({ agent }: AgentFormProps) {
    const router = useRouter();
    const isEditing = !!agent;

    const [name, setName] = useState(agent?.name || "");
    const [description, setDescription] = useState(agent?.description || "");
    const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || "");
    const [avatarColor, setAvatarColor] = useState(agent?.avatar_color || AVATAR_COLORS[0]);
    const [isActive, setIsActive] = useState(agent?.is_active ?? true);
    const [welcomeMessage, setWelcomeMessage] = useState(agent?.welcome_message || "");
    const [suggestions, setSuggestions] = useState<string[]>(
        Array.isArray(agent?.suggestions) ? agent.suggestions : []
    );
    const [newSuggestion, setNewSuggestion] = useState("");

    // Document template state (impl. 004)
    const [producesDocument, setProducesDocument] = useState(agent?.produces_document ?? false);
    const [documentTitle, setDocumentTitle] = useState(agent?.document_title || "");
    const [documentSections, setDocumentSections] = useState<DocumentSection[]>(
        agent?.document_template?.sections ?? []
    );
    const [newSection, setNewSection] = useState({ ...EMPTY_SECTION });
    const [showSectionForm, setShowSectionForm] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addSuggestion = () => {
        const trimmed = newSuggestion.trim();
        if (!trimmed || suggestions.length >= 6) return;
        setSuggestions((prev) => [...prev, trimmed]);
        setNewSuggestion("");
    };

    const removeSuggestion = (index: number) => {
        setSuggestions((prev) => prev.filter((_, i) => i !== index));
    };

    const addDocumentSection = () => {
        const key = newSection.key.trim();
        const label = newSection.label.trim();
        const instruction = newSection.instruction.trim();
        if (!key || !label || !instruction) return;
        if (newSection.type === "tabela" && !newSection.columnsRaw.trim()) return;

        const section: DocumentSection = { key, label, instruction, type: newSection.type };
        if (newSection.type === "tabela") {
            section.columns = newSection.columnsRaw.split(",").map((c) => c.trim()).filter(Boolean);
        }

        setDocumentSections((prev) => [...prev, section]);
        setNewSection({ ...EMPTY_SECTION });
        setShowSectionForm(false);
    };

    const removeDocumentSection = (index: number) => {
        setDocumentSections((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            const url = isEditing ? `/api/admin/agents/${agent.id}` : "/api/admin/agents";
            const method = isEditing ? "PUT" : "POST";

            const document_template =
                producesDocument && documentSections.length > 0
                    ? { title: documentTitle.trim() || undefined, sections: documentSections }
                    : null;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    system_prompt: systemPrompt,
                    avatar_color: avatarColor,
                    is_active: isActive,
                    welcome_message: welcomeMessage.trim() || null,
                    suggestions: suggestions.map((s) => s.trim()).filter(Boolean),
                    produces_document: producesDocument,
                    document_title: documentTitle.trim() || null,
                    document_template,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao salvar");
            }

            const data = await res.json();
            router.push(`/admin/agents/${data.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!agent || !confirm(`Excluir agente "${agent.name}"? Esta ação não pode ser desfeita.`)) return;
        setIsDeleting(true);
        try {
            await fetch(`/api/admin/agents/${agent.id}`, { method: "DELETE" });
            router.push("/admin/agents");
            router.refresh();
        } catch {
            alert("Erro ao excluir.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}

            <Card>
                <CardContent className="pt-6 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Agente *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Especialista em POR"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descrição para os usuários"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="system_prompt">
                            System Prompt *
                            <span className="ml-2 text-xs text-scout-400 font-normal">
                                ({systemPrompt.length} caracteres)
                            </span>
                        </Label>
                        <textarea
                            id="system_prompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={10}
                            required
                            placeholder="Você é um especialista em metodologia escoteira da UEB. Seu papel é..."
                            className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-scout-500 focus:border-transparent resize-y font-mono"
                        />
                        <p className="text-xs text-scout-400">
                            Defina a personalidade, especialidade e comportamento do agente. Os documentos anexados serão adicionados automaticamente ao contexto.
                        </p>
                    </div>

                    {/* Avatar Color */}
                    <div className="space-y-2">
                        <Label>Cor do Avatar</Label>
                        <div className="flex gap-3 flex-wrap">
                            {AVATAR_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setAvatarColor(color)}
                                    className={`w-9 h-9 rounded-full shadow transition-transform hover:scale-110 ${avatarColor === color ? "ring-2 ring-scout-600 ring-offset-2 scale-110" : ""}`}
                                    style={{ background: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                        <Label htmlFor="is_active" className="cursor-pointer">Agente Ativo</Label>
                        <button
                            id="is_active"
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-scout-500" : "bg-cream-300"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <span className="text-xs text-scout-500">{isActive ? "Visível para usuários" : "Oculto"}</span>
                    </div>

                    {/* Welcome Message */}
                    <div className="space-y-2 border-t border-cream-200 pt-5">
                        <Label htmlFor="welcome_message">
                            Mensagem de Boas-vindas
                            <span className="ml-2 text-xs text-scout-400 font-normal">opcional</span>
                        </Label>
                        <textarea
                            id="welcome_message"
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            rows={3}
                            placeholder="Olá! Sou o especialista em formação escoteira. Como posso ajudar você hoje?"
                            className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-scout-500 focus:border-transparent resize-y"
                        />
                        <p className="text-xs text-scout-400">
                            Exibida no chat antes da primeira mensagem. Deixe vazio para usar o comportamento padrão.
                        </p>
                    </div>

                    {/* Suggestions Editor */}
                    <div className="space-y-2">
                        <Label>
                            Sugestões de Pergunta
                            <span className="ml-2 text-xs text-scout-400 font-normal">
                                {suggestions.length}/6
                            </span>
                        </Label>

                        {suggestions.length > 0 && (
                            <div className="space-y-1.5">
                                {suggestions.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-cream-50 border border-cream-200 rounded-lg px-3 py-2">
                                        <span className="flex-1 text-sm text-scout-700">{s}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSuggestion(i)}
                                            className="text-scout-400 hover:text-red-500 transition-colors"
                                            aria-label="Remover sugestão"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {suggestions.length < 6 && (
                            <div className="flex gap-2">
                                <Input
                                    value={newSuggestion}
                                    onChange={(e) => setNewSuggestion(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") { e.preventDefault(); addSuggestion(); }
                                    }}
                                    placeholder="Ex: Como criar um PUD para o ramo escoteiro?"
                                    className="flex-1 text-sm border-cream-300 bg-cream-50"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={addSuggestion}
                                    disabled={!newSuggestion.trim()}
                                    className="border-scout-300 text-scout-600 hover:bg-scout-50"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-scout-400">
                            Botões exibidos no chat vazio para orientar o usuário. Máximo 6. Sem sugestões, exibe perguntas padrão.
                        </p>
                    </div>

                    {/* Document generation toggle */}
                    <div className="space-y-4 border-t border-cream-200 pt-5">
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-azure-600" />
                            <Label htmlFor="produces_document" className="cursor-pointer">Este agente gera documento</Label>
                            <button
                                id="produces_document"
                                type="button"
                                onClick={() => setProducesDocument(!producesDocument)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${producesDocument ? "bg-azure-500" : "bg-cream-300"}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${producesDocument ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                            <span className="text-xs text-scout-500">
                                {producesDocument ? "Botão 'Gerar documento' visível no chat" : "Desabilitado"}
                            </span>
                        </div>

                        {producesDocument && (
                            <div className="space-y-4 pl-2 border-l-2 border-azure-200">
                                {/* Document title */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="document_title">
                                        Título do documento
                                        <span className="ml-2 text-xs text-scout-400 font-normal">opcional</span>
                                    </Label>
                                    <Input
                                        id="document_title"
                                        value={documentTitle}
                                        onChange={(e) => setDocumentTitle(e.target.value)}
                                        placeholder="Ex: Ata de Reunião de Grupo Escoteiro"
                                        className="border-cream-300 bg-cream-50 text-sm"
                                    />
                                    <p className="text-xs text-scout-400">
                                        Usado como título do arquivo gerado. Se vazio, usa o nome do agente.
                                    </p>
                                </div>

                                {/* Sections list */}
                                <div className="space-y-2">
                                    <Label>
                                        Seções do documento
                                        <span className="ml-2 text-xs text-scout-400 font-normal">
                                            {documentSections.length} seção{documentSections.length !== 1 ? "ões" : ""}
                                        </span>
                                    </Label>

                                    {documentSections.length > 0 && (
                                        <div className="space-y-1.5">
                                            {documentSections.map((sec, i) => (
                                                <div key={i} className="flex items-start gap-2 bg-azure-50 border border-azure-100 rounded-lg px-3 py-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono text-azure-600 bg-azure-100 px-1.5 py-0.5 rounded">
                                                                {sec.type}
                                                            </span>
                                                            <span className="text-sm font-medium text-scout-800 truncate">{sec.label}</span>
                                                            <span className="text-xs text-scout-400 font-mono">({sec.key})</span>
                                                        </div>
                                                        <p className="text-xs text-scout-500 mt-0.5 line-clamp-1">{sec.instruction}</p>
                                                        {sec.columns && (
                                                            <p className="text-xs text-azure-600 mt-0.5">
                                                                Colunas: {sec.columns.join(", ")}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDocumentSection(i)}
                                                        className="text-scout-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                                                        aria-label="Remover seção"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add section form */}
                                    {showSectionForm ? (
                                        <div className="border border-azure-200 rounded-lg p-3 space-y-3 bg-white">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Key *</Label>
                                                    <Input
                                                        value={newSection.key}
                                                        onChange={(e) => setNewSection((p) => ({ ...p, key: e.target.value }))}
                                                        placeholder="cabecalho"
                                                        className="text-xs border-cream-300 bg-cream-50 font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Tipo *</Label>
                                                    <select
                                                        value={newSection.type}
                                                        onChange={(e) => setNewSection((p) => ({ ...p, type: e.target.value as SectionType }))}
                                                        className="w-full h-9 px-2 rounded-md border border-cream-300 bg-cream-50 text-xs focus:outline-none focus:ring-2 focus:ring-scout-500"
                                                    >
                                                        <option value="texto">texto</option>
                                                        <option value="lista">lista</option>
                                                        <option value="tabela">tabela</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Rótulo *</Label>
                                                <Input
                                                    value={newSection.label}
                                                    onChange={(e) => setNewSection((p) => ({ ...p, label: e.target.value }))}
                                                    placeholder="Cabeçalho"
                                                    className="text-xs border-cream-300 bg-cream-50"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Instrução para o modelo *</Label>
                                                <textarea
                                                    value={newSection.instruction}
                                                    onChange={(e) => setNewSection((p) => ({ ...p, instruction: e.target.value }))}
                                                    placeholder="Extraia data, local e participantes mencionados na conversa."
                                                    rows={2}
                                                    className="w-full px-2 py-1.5 rounded-md border border-cream-300 bg-cream-50 text-xs focus:outline-none focus:ring-2 focus:ring-scout-500 resize-none"
                                                />
                                            </div>
                                            {newSection.type === "tabela" && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Colunas * (separadas por vírgula)</Label>
                                                    <Input
                                                        value={newSection.columnsRaw}
                                                        onChange={(e) => setNewSection((p) => ({ ...p, columnsRaw: e.target.value }))}
                                                        placeholder="Assunto, Decisão, Responsável"
                                                        className="text-xs border-cream-300 bg-cream-50"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={addDocumentSection}
                                                    disabled={
                                                        !newSection.key.trim() ||
                                                        !newSection.label.trim() ||
                                                        !newSection.instruction.trim() ||
                                                        (newSection.type === "tabela" && !newSection.columnsRaw.trim())
                                                    }
                                                    className="border-azure-300 text-azure-700 hover:bg-azure-50"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => { setShowSectionForm(false); setNewSection({ ...EMPTY_SECTION }); }}
                                                    className="text-scout-500"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowSectionForm(true)}
                                            className="border-azure-200 text-azure-600 hover:bg-azure-50"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova seção
                                        </Button>
                                    )}

                                    {producesDocument && documentSections.length === 0 && !showSectionForm && (
                                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                                            Adicione ao menos uma seção para o agente poder gerar documentos.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3">
                <Button type="submit" variant="scout" disabled={isSaving} className="flex-1">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {isEditing ? "Salvar Alterações" : "Criar Agente"}
                </Button>
                {isEditing && (
                    <Button type="button" variant="outline" onClick={handleDelete} disabled={isDeleting}
                        className="border-red-200 text-red-600 hover:bg-red-50">
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                )}
            </div>
        </form>
    );
}
