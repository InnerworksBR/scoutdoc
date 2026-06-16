"use client";

import { BookOpen } from "lucide-react";

interface CitationBadgeProps {
    source: string;
    index?: number;
}

export default function CitationBadge({ source, index }: CitationBadgeProps) {
    return (
        <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-semibold align-middle"
            style={{
                background: "oklch(0.94 0.06 80)",
                color: "oklch(0.42 0.14 80)",
                border: "1px solid oklch(0.86 0.08 80)",
            }}
            aria-label={`Fonte: ${source}`}
            title={source}
        >
            <BookOpen className="w-2.5 h-2.5 flex-shrink-0" />
            {index !== undefined ? `[${index + 1}]` : source}
        </span>
    );
}

interface ReferenceFooterProps {
    references: string[];
}

export function ReferenceFooter({ references }: ReferenceFooterProps) {
    if (references.length === 0) return null;

    return (
        <div
            className="mt-3 pt-2.5 border-t flex flex-col gap-1"
            style={{ borderColor: "oklch(0.90 0.02 100)" }}
        >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-scout-400">
                Fontes consultadas
            </p>
            <div className="flex flex-col gap-1">
                {references.map((ref, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <span
                            className="text-[10px] font-bold w-4 text-center"
                            style={{ color: "oklch(0.42 0.14 80)" }}
                        >
                            [{i + 1}]
                        </span>
                        <span className="text-[11px] text-scout-600 leading-tight">{ref}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
