"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string | null;
    data?: any;
    downloadHandler?: (format: "docx" | "pdf") => Promise<void>;
}

export default function PreviewModal({
    isOpen,
    onClose,
    title,
    content,
    data,
    downloadHandler,
}: PreviewModalProps) {
    const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const handleDownload = async (format: "docx" | "pdf") => {
        const setLoading = format === "docx" ? setIsDownloadingDocx : setIsDownloadingPdf;
        setLoading(true);
        try {
            if (downloadHandler) {
                await downloadHandler(format);
                return;
            }
            if (!data) return;
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

    const downloadDisabled = !data && !downloadHandler;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative bg-white border-[3px] border-ink rounded-[20px] shadow-[7px_8px_0_#16302b] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* gradient stripe */}
                        <div className="h-[9px] bg-gradient-to-r from-scout-600 via-azure-500 to-gold-500" />

                        {/* selo APROVADO */}
                        <div className="absolute top-[26px] right-[26px] z-[5] w-[92px] h-[92px] rounded-full border-4 border-scout-600/50 text-scout-600/80 flex flex-col items-center justify-center -rotate-[14deg] text-center pointer-events-none">
                            <span className="font-display font-semibold text-[17px] leading-none">APROVADO</span>
                            <span className="text-[8px] font-bold tracking-[0.08em] mt-1">POR ✓</span>
                        </div>

                        {/* Header */}
                        <div className="flex items-start justify-between px-7 pt-5 pb-3">
                            <div>
                                <div className="inline-flex items-center gap-1.5 bg-lime border-[2.5px] border-ink rounded-full px-3 py-1 font-display font-semibold text-[12px] text-ink shadow-[2px_2px_0_#16302b] mb-2.5">
                                    ✓ PUD gerado
                                </div>
                                <h3 className="font-display font-semibold text-xl text-ink max-w-[380px] leading-tight">{title}</h3>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7a73] hover:bg-cream-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto sd-scroll px-7 pb-5">
                            <pre className="whitespace-pre-wrap text-sm font-mono text-scout-800 bg-cream-50 p-4 rounded-[14px] border-[2.5px] border-cream-200 leading-relaxed">
                                {content || "Nenhum conteúdo gerado ainda."}
                            </pre>
                        </div>

                        {/* Footer */}
                        <div className="px-7 py-4 border-t-2 border-cream-200 bg-cream-50 flex justify-end gap-2 flex-wrap">
                            <Button variant="outline" onClick={onClose}>
                                Fechar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleDownload("pdf")}
                                disabled={isDownloadingPdf || downloadDisabled}
                                className="text-azure-600 border-azure-500"
                            >
                                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                                .PDF
                            </Button>
                            <Button variant="gold" onClick={() => handleDownload("docx")} disabled={isDownloadingDocx || downloadDisabled}>
                                {isDownloadingDocx ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                .DOCX
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
