"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Download, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string | null;
    data?: any;
}

export default function PreviewModal({
    isOpen,
    onClose,
    title,
    content,
    data,
}: PreviewModalProps) {
    const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const handleDownload = async (format: "docx" | "pdf") => {
        if (!data) return;
        const setLoading = format === "docx" ? setIsDownloadingDocx : setIsDownloadingPdf;
        setLoading(true);
        try {
            const response = await fetch(`/api/download/${format}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data?.title?.replace(/[^a-z0-9]/gi, "_") || "scout_doc"}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
            alert("Erro ao baixar arquivo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-scout-900/40 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-scout-100"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-cream-200 bg-scout-gradient text-white">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5" />
                                <h3 className="font-display font-semibold text-lg">{title}</h3>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/20 text-white">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            <pre className="whitespace-pre-wrap text-sm font-mono text-scout-700 bg-cream-50 p-4 rounded-md border border-cream-200">
                                {content || "Nenhum conteúdo gerado ainda."}
                            </pre>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-cream-200 bg-cream-50 flex justify-end gap-2 flex-wrap">
                            <Button variant="outline" onClick={onClose} className="border-scout-200 text-scout-700 hover:bg-scout-50">
                                Fechar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleDownload("pdf")}
                                disabled={isDownloadingPdf || !data}
                                className="border-azure-300 text-azure-700 hover:bg-azure-50"
                            >
                                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                                Baixar .PDF
                            </Button>
                            <Button variant="scout" onClick={() => handleDownload("docx")} disabled={isDownloadingDocx || !data}>
                                {isDownloadingDocx ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                Baixar .DOCX
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
