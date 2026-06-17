"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import StepForm from "@/components/StepForm";
import LoadingScout from "@/components/LoadingScout";
import PreviewModal from "@/components/PreviewModal";

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
        return <LoadingScout />;
    }

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col">
            <header className="border-b-2 border-cream-200 bg-white sticky top-0 z-30">
                <div className="max-w-[900px] mx-auto px-6 h-[62px] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Image src="/brand/emblema.png" alt="Escoteiros do Brasil" width={30} height={30} className="h-[30px] w-auto" priority />
                        <span className="font-display font-semibold text-base text-ink">Gerador de PUD</span>
                    </div>
                    <Link href="/dashboard" className="text-[13px] font-semibold text-[#6a7a73] hover:text-ink transition-colors">
                        ✕ Cancelar
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center px-6 py-9 pb-12">
                <div className="text-center mb-6">
                    <h1 className="font-display font-semibold text-3xl text-ink mb-1.5">Vamos montar seu plano</h1>
                    <p className="text-[#5a6a63] text-[15px] font-medium">Quatro paradas até o documento pronto.</p>
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
