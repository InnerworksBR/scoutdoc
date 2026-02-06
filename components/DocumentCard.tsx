"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MoreVertical, Calendar, Download, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentCardProps {
    doc: any;
}

export default function DocumentCard({ doc }: DocumentCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);

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

    return (
        <Card className="group hover:border-forest-300 transition-colors bg-white">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="p-2 bg-sand-100 rounded-md group-hover:bg-forest-50 transition-colors">
                    <FileText className="w-5 h-5 text-forest-600" />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-forest-400">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
                            <Download className="w-4 h-4 mr-2" />
                            {isDownloading ? "Baixando..." : "Baixar .docx"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="mb-1 text-xs font-semibold text-forest-500 uppercase tracking-wider">
                    {doc.linha} • {doc.type}
                </div>
                <h3 className="font-display font-bold text-lg text-forest-900 mb-2 truncate" title={doc.title}>
                    {doc.title}
                </h3>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-xs text-forest-400">
                        <Calendar className="w-3 h-3 mr-1" />{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${doc.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                        >
                            {doc.status === "completed" ? "Gerado" : "Rascunho"}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-forest-500 hover:text-forest-700"
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
