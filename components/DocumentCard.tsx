"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, MoreVertical, Calendar, Download, Loader2, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";

interface DocumentCardProps {
    doc: any;
    onDelete?: (id: string) => void;
}

export default function DocumentCard({ doc, onDelete }: DocumentCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch("/api/download/docx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(doc.content),
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${doc.title.replace(/[^a-z0-9]/gi, "_") || "scout_doc"}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
            alert("Erro ao baixar arquivo.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Excluir "${doc.title}"? Esta ação não pode ser desfeita.`)) return;
        setIsDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("documents").delete().eq("id", doc.id);
            if (error) throw error;
            onDelete?.(doc.id);
        } catch (error) {
            console.error("Delete error:", error);
            alert("Erro ao excluir documento.");
        } finally {
            setIsDeleting(false);
        }
    };

    const isReady = doc.status === "completed";

    return (
        <div className="group bg-white border-[3px] border-ink rounded-[18px] shadow-[4px_4px_0_#16302b] p-[18px] transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#16302b]">
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[12px] border-[2.5px] border-ink flex items-center justify-center text-ink" style={{ background: isReady ? "#d8f5e3" : "#fff2b8" }}>
                    <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="font-display font-semibold text-[11px] text-ink border-2 border-ink px-2.5 py-0.5 rounded-full" style={{ background: isReady ? "#b0dd43" : "#ffda3e" }}>
                        {isReady ? "Pronto" : "Rascunho"}
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6a7a73]">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
                                <Download className="w-4 h-4 mr-2" />
                                {isDownloading ? "Baixando..." : "Baixar .docx"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isDeleting ? "Excluindo..." : "Excluir"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="mb-1 text-[11px] font-bold text-scout-600 uppercase tracking-wider">
                {doc.linha} • {doc.type}
            </div>
            <h3 className="font-display font-semibold text-[15px] text-ink leading-tight mb-2 truncate" title={doc.title}>
                {doc.title}
            </h3>
            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center text-xs text-[#6a7a73] font-semibold">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-scout-600 hover:text-azure-600"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    title="Baixar rapidamente"
                >
                    {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                </Button>
            </div>
        </div>
    );
}
