"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, Trash2, Compass, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserAvatar from "@/components/UserAvatar";
import { validateImageFile, MAX_AVATAR_IMAGE_SIZE } from "@/lib/imageValidation";

interface ProfileClientProps {
    userEmail: string;
    avatarUrl: string | null;
    displayName: string | null;
}

export default function ProfileClient({ userEmail, avatarUrl: initialAvatarUrl, displayName: initialDisplayName }: ProfileClientProps) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
    const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validationError = validateImageFile(file, MAX_AVATAR_IMAGE_SIZE);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(URL.createObjectURL(file));
        setIsUploading(true);

        try {
            const urlRes = await fetch("/api/profile/avatar/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: file.name, contentType: file.type }),
            });

            if (!urlRes.ok) {
                const err = await urlRes.json();
                throw new Error(err.error || "Erro ao obter URL de upload");
            }

            const { signedUrl, publicUrl } = await urlRes.json();

            const uploadRes = await fetch(signedUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadRes.ok) throw new Error("Falha no upload da imagem");

            await fetch("/api/profile/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: publicUrl }),
            });

            setAvatarUrl(publicUrl);
            setLocalPreview(null);
            setSuccess("Foto atualizada com sucesso.");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            if (localPreview) URL.revokeObjectURL(localPreview);
            setLocalPreview(null);
        } finally {
            setIsUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const handleRemoveAvatar = async () => {
        setIsRemoving(true);
        setError(null);
        try {
            const res = await fetch("/api/profile/avatar", { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao remover foto");
            setAvatarUrl(null);
            setSuccess("Foto removida.");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsRemoving(false);
        }
    };

    const handleSaveDisplayName = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/profile/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName }),
            });
            if (!res.ok) throw new Error("Erro ao salvar nome");
            setSuccess("Nome atualizado.");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const displayUrl = localPreview ?? avatarUrl;

    return (
        <div className="min-h-screen bg-cream-50 font-body">
            <nav className="border-b border-cream-200 bg-white sticky top-0 z-30">
                <div className="container mx-auto px-4 h-16 flex items-center gap-3">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-scout-600 text-xs">
                            <ArrowLeft className="w-3 h-3 mr-1" /> Dashboard
                        </Button>
                    </Link>
                    <div className="h-5 w-px bg-cream-200" />
                    <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-scout-500" />
                        <span className="font-display font-bold text-scout-800">Meu Perfil</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-10 max-w-lg">
                {error && (
                    <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600">✕</button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 text-sm text-scout-700 bg-scout-50 border border-scout-200 rounded-lg flex items-center justify-between">
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="ml-3 text-scout-400 hover:text-scout-600">✕</button>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-6 space-y-6">
                    {/* Avatar section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <UserAvatar
                                avatarUrl={displayUrl}
                                email={userEmail}
                                size={96}
                                className="shadow-md"
                            />
                            {isUploading && (
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileRef.current?.click()}
                                disabled={isUploading || isRemoving}
                                className="border-scout-300 text-scout-700 hover:bg-scout-50"
                            >
                                <Camera className="w-3.5 h-3.5 mr-1.5" />
                                {avatarUrl ? "Alterar foto" : "Adicionar foto"}
                            </Button>
                            {avatarUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveAvatar}
                                    disabled={isRemoving || isUploading}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    {isRemoving
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Trash2 className="w-3.5 h-3.5" />
                                    }
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-scout-400">PNG, JPG ou WebP · Máximo 2 MB</p>
                    </div>

                    {/* Email (read-only) */}
                    <div className="space-y-1.5">
                        <Label className="text-sm">E-mail</Label>
                        <Input value={userEmail} disabled className="bg-cream-50 text-scout-500 text-sm" />
                    </div>

                    {/* Display name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="display_name" className="text-sm">Nome de exibição</Label>
                        <div className="flex gap-2">
                            <Input
                                id="display_name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Como deseja ser chamado?"
                                className="text-sm border-cream-300 bg-cream-50 flex-1"
                            />
                            <Button
                                type="button"
                                variant="scout"
                                size="sm"
                                onClick={handleSaveDisplayName}
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Save className="w-3.5 h-3.5" />
                                }
                            </Button>
                        </div>
                        <p className="text-xs text-scout-400">Aparece no dashboard. Deixe vazio para usar seu e-mail.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
