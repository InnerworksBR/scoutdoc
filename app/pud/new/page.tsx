"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, X } from "lucide-react";
import StepForm from "@/components/StepForm";
import LoadingScout from "@/components/LoadingScout";
import PreviewModal from "@/components/PreviewModal";
import { Button } from "@/components/ui/button";

export default function NewPUDPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const [rawData, setRawData] = useState<any>(null);

    const handleFormComplete = async (data: any) => {
        setIsGenerating(true);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Falha na geração");

            const generatedData = await response.json();
            setRawData(generatedData);

            const formattedPreview = `
# ${generatedData.title}

**Objetivo:** ${generatedData.objective}
**Duração:** ${generatedData.duration}

## Materiais
${generatedData.materials.map((m: string) => `- ${m}`).join("\n")}

## Desenvolvimento
${generatedData.steps.map((s: any) => `### ${s.title} (${s.time})\n${s.description}`).join("\n\n")}

## Avaliação
${generatedData.evaluation}

## Segurança
${generatedData.safety}

## Rubrica de Avaliação
${generatedData.rubric?.map((r: any) => `- ${r.criteria} (${r.bloom})`).join("\n") || "N/A"}

## Checklist (Autoauditoria)
${generatedData.daily_checklist?.map((c: any) => `- [${c.checked ? "x" : " "}] ${c.item}`).join("\n") || "N/A"}

## Comentários
${generatedData.comments?.map((c: string) => `- ${c}`).join("\n") || "N/A"}
            `.trim();

            setGeneratedContent(formattedPreview);
            setIsGenerating(false);
            setShowPreview(true);
        } catch (error) {
            console.error("Erro:", error);
            setIsGenerating(false);
            alert("Erro ao gerar o documento. Tente novamente.");
        }
    };

    if (isGenerating) {
        return (
            <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center">
                <LoadingScout />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-50 font-body flex flex-col">
            <header className="border-b border-cream-200 bg-white sticky top-0 z-30">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-scout-700">
                        <Compass className="w-6 h-6" strokeWidth={2} />
                        <span className="font-display font-bold text-lg hidden sm:inline">Gerador de PUD</span>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-scout-500 hover:text-scout-800">
                            <X className="w-4 h-4 mr-2" /> Cancelar
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-scout-900">
                        Vamos criar seu plano
                    </h1>
                    <p className="text-scout-600">
                        Preencha os dados abaixo e deixe a IA estruturar o conteúdo técnico.
                    </p>
                </div>

                <StepForm onComplete={handleFormComplete} />
            </main>

            <PreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Pré-visualização do PUD"
                content={generatedContent}
                data={rawData}
            />
        </div>
    );
}
