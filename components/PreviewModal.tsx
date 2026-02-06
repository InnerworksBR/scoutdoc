"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string | null;
    data?: any; // The raw data to send to the generator
}

export default function PreviewModal({
    isOpen,
    onClose,
    title,
    content,
    data,
}: PreviewModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!data) return;
        setIsDownloading(true);
        try {
            const response = await fetch("/api/download/docx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data?.title?.replace(/[^a-z0-9]/gi, '_') || "scout_doc"}.docx`;
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
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/40 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-sand-200 bg-sand-50">
                            <div className="flex items-center space-x-2 text-forest-800">
                                <FileText className="w-5 h-5" />
                                <h3 className="font-display font-semibold text-lg">{title}</h3>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-sand-200">
                                <X className="w-5 h-5 text-forest-600" />
                            </Button>
                        </div>

                        {/* Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white prose prose-forest max-w-none">
                            <pre className="whitespace-pre-wrap text-sm font-mono text-forest-700 bg-sand-50 p-4 rounded-md border border-sand-200">
                                {content || "Nenhum conteúdo gerado ainda."}
                            </pre>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-sand-200 bg-sand-50 flex justify-end space-x-2">
                            <Button variant="outline" onClick={onClose}>
                                Editar
                            </Button>
                            <Button variant="scout" onClick={handleDownload} disabled={isDownloading || !data}>
                                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                Baixar .DOCX
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
