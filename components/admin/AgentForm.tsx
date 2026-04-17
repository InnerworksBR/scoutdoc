"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, Trash2 } from "lucide-react";

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
    };
}

export default function AgentForm({ agent }: AgentFormProps) {
    const router = useRouter();
    const isEditing = !!agent;

    const [name, setName] = useState(agent?.name || "");
    const [description, setDescription] = useState(agent?.description || "");
    const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || "");
    const [avatarColor, setAvatarColor] = useState(agent?.avatar_color || AVATAR_COLORS[0]);
    const [isActive, setIsActive] = useState(agent?.is_active ?? true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            const url = isEditing ? `/api/admin/agents/${agent.id}` : "/api/admin/agents";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, system_prompt: systemPrompt, avatar_color: avatarColor, is_active: isActive }),
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
