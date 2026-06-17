"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Plus } from "lucide-react";
import DocumentCard from "@/components/DocumentCard";

interface DashboardClientProps {
    documents: any[];
}

export default function DashboardClient({ documents: initialDocs }: DashboardClientProps) {
    const [documents, setDocuments] = useState(initialDocs);
    const [search, setSearch] = useState("");

    const filtered = documents.filter((doc) =>
        doc.title?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id: string) => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
    };

    return (
        <>
            {/* Filter Bar */}
            <div className="flex items-center mb-5 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8aa39a]" />
                    <Input
                        placeholder="Buscar documentos..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Document Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
                ))}

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="col-span-full bg-white border-[3px] border-dashed border-cream-300 rounded-[20px] p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-cream-100 border-[2.5px] border-ink rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-7 h-7 text-scout-600" />
                        </div>
                        {search ? (
                            <>
                                <h3 className="font-display font-semibold text-lg text-ink">Nenhum resultado</h3>
                                <p className="text-[#5a6a63] mb-4 font-medium">Nenhum documento com &ldquo;{search}&rdquo;.</p>
                                <Button variant="outline" onClick={() => setSearch("")}>Limpar busca</Button>
                            </>
                        ) : (
                            <>
                                <h3 className="font-display font-semibold text-lg text-ink">Nenhum documento ainda</h3>
                                <p className="text-[#5a6a63] mb-6 max-w-sm font-medium">Comece criando seu primeiro Plano de Unidade Didática agora mesmo.</p>
                                <Link href="/pud/new">
                                    <Button variant="scout">
                                        <Plus className="w-4 h-4 mr-2" /> Criar PUD
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
