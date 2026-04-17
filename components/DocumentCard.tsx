"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

    return (
        <Card className="group hover:border-scout-300 hover:shadow-lg hover:shadow-azure-100/50 transition-all bg-white">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="p-2 bg-cream-100 rounded-md group-hover:bg-scout-50 transition-colors">
                    <FileText className="w-5 h-5 text-scout-600" />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-scout-400">
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
            </CardHeader>
            <CardContent>
                <div className="mb-1 text-xs font-semibold text-scout-500 uppercase tracking-wider">
                    {doc.linha} • {doc.type}
                </div>
                <h3 className="font-display font-bold text-lg text-scout-900 mb-2 truncate" title={doc.title}>
                    {doc.title}
                </h3>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-xs text-scout-400">
                        <Calendar className="w-3 h-3 mr-1" />{" "}
                        {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${doc.status === "completed"
                                    ? "bg-scout-100 text-scout-700"
                                    : "bg-gold-300/40 text-gold-700"
                                }`}
                        >
                            {doc.status === "completed" ? "Gerado" : "Rascunho"}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-scout-500 hover:text-azure-600"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            title="Baixar rapidamente"
                        >
                            {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
