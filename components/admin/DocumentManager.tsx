"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, FileText, Loader2, File, Sparkles } from "lucide-react";

interface Doc {
    id: string;
    name: string;
    file_type: string;
    file_size?: number;
    created_at: string;
}

interface DocumentManagerProps {
    agentId: string;
    initialDocuments: Doc[];
}

function formatBytes(bytes?: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentManager({ agentId, initialDocuments }: DocumentManagerProps) {
    const [documents, setDocuments] = useState<Doc[]>(initialDocuments);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isReindexing, setIsReindexing] = useState(false);
    const [reindexMsg, setReindexMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReindex = async () => {
        setIsReindexing(true);
        setReindexMsg(null);
        setError(null);
        try {
            const res = await fetch(`/api/admin/agents/${agentId}/documents/reindex`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
            const failurePart = data.failures?.length
                ? ` · ${data.failures.length} falha(s): ${data.failures.join(", ")}`
                : "";
            setReindexMsg(`Indexação concluída: ${data.documents} documento(s), ${data.chunks} trecho(s)${failurePart}.`);
        } catch (err: any) {
            setError(err.message || "Erro ao reindexar.");
        } finally {
            setIsReindexing(false);
        }
    };

    const uploadSingle = async (file: File) => {
        const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");
        const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
        if (!isTxt && !isPdf) {
            throw new Error(`"${file.name}": apenas PDF e TXT são suportados.`);
        }

        if (isTxt) {
            // TXT: lê o texto e envia direto para o banco via API
            setUploadProgress("Lendo arquivo...");
            const contentText = await file.text();

            setUploadProgress("Salvando no banco...");
            const res = await fetch(`/api/admin/agents/${agentId}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: file.name,
                    fileType: "txt",
                    fileSize: file.size,
                    contentText,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
            setDocuments((prev) => [data, ...prev]);

        } else {
            // PDF: upload direto para o Supabase Storage via URL assinada
            setUploadProgress("Obtendo URL de upload...");
            const urlRes = await fetch(`/api/admin/agents/${agentId}/documents/upload-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: file.name }),
            });
            const { signedUrl, filePath, error: urlError } = await urlRes.json();
            if (urlError) throw new Error(urlError);

            setUploadProgress("Enviando arquivo...");
            const uploadRes = await fetch(signedUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!uploadRes.ok) throw new Error("Falha no upload para o Storage");

            setUploadProgress("Salvando registro...");
            const metaRes = await fetch(`/api/admin/agents/${agentId}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: file.name,
                    filePath,
                    fileType: "pdf",
                    fileSize: file.size,
                }),
            });
            const data = await metaRes.json();
            if (!metaRes.ok) throw new Error(data.error || `Erro ${metaRes.status}`);
            setDocuments((prev) => [data, ...prev]);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        setError(null);
        setIsUploading(true);

        const errors: string[] = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const prefix = files.length > 1 ? `(${i + 1}/${files.length}) ${file.name} — ` : "";
                try {
                    setUploadProgress(`${prefix}preparando...`);
                    await uploadSingle(file);
                } catch (err: any) {
                    errors.push(err.message);
                }
            }
            if (errors.length > 0) setError(errors.join(" "));
        } finally {
            setIsUploading(false);
            setUploadProgress("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm("Remover este documento?")) return;
        setDeletingId(docId);
        try {
            await fetch(`/api/admin/agents/${agentId}/documents?docId=${docId}`, { method: "DELETE" });
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
        } catch {
            alert("Erro ao remover.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className="border-2 border-dashed border-azure-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-azure-400 hover:bg-azure-50 transition-colors"
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <Upload className="w-8 h-8 text-azure-400 mb-3" />
                <p className="font-semibold text-scout-800">Clique para selecionar arquivos</p>
                <p className="text-xs text-scout-500 mt-1">PDF ou TXT • Máx. 50 MB cada • vários de uma vez</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,text/plain,application/pdf"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={isUploading}
                />
            </div>

            {isUploading && (
                <div className="flex items-center gap-2 text-azure-600 text-sm bg-azure-50 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress || "Enviando arquivo..."}
                </div>
            )}

            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}

            {reindexMsg && (
                <div className="p-3 text-sm text-scout-700 bg-scout-50 border border-scout-200 rounded-lg">{reindexMsg}</div>
            )}

            {/* Reindex (busca semântica) */}
            {documents.length > 0 && (
                <div className="flex items-center justify-between gap-3 bg-azure-50/60 border border-azure-100 rounded-lg p-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-scout-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-azure-500" /> Busca semântica
                        </p>
                        <p className="text-xs text-scout-500">
                            Indexa os documentos para o agente buscar trechos relevantes. Use após subir arquivos antigos.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleReindex}
                        disabled={isReindexing || isUploading}
                        className="border-azure-300 text-azure-700 hover:bg-azure-100 flex-shrink-0"
                    >
                        {isReindexing
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            : <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        }
                        Reindexar
                    </Button>
                </div>
            )}

            {/* Document List */}
            {documents.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs text-scout-500 font-semibold uppercase tracking-wider">
                        {documents.length} documento{documents.length !== 1 ? "s" : ""}
                    </p>
                    {documents.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg border border-cream-200 p-4 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                                doc.file_type === "pdf" ? "bg-red-50" : "bg-azure-50"
                            }`}>
                                {doc.file_type === "pdf"
                                    ? <File className="w-4 h-4 text-red-500" />
                                    : <FileText className="w-4 h-4 text-azure-500" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-scout-800 truncate">{doc.name}</p>
                                <p className="text-xs text-scout-400">
                                    {doc.file_type?.toUpperCase()} · {formatBytes(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                                onClick={() => handleDelete(doc.id)}
                                disabled={deletingId === doc.id}
                            >
                                {deletingId === doc.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />
                                }
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-scout-400 py-4">
                    Nenhum documento ainda. Faça upload de arquivos PDF ou TXT.
                </p>
            )}
        </div>
    );
}
