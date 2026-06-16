import { GeneratedContent } from "./ai";

export type Section =
    | { kind: "title"; text: string }
    | { kind: "metaTable"; rows: { label: string; value: string }[] }
    | { kind: "heading"; text: string }
    | { kind: "steps"; items: { title: string; time: string; description: string }[] }
    | { kind: "bullets"; items: string[] }
    | { kind: "paragraph"; text: string }
    | { kind: "table"; headers: string[]; rows: string[][] }
    | { kind: "pageBreak" };

export interface DocumentModel {
    sections: Section[];
}

export function buildPudModel(content: GeneratedContent): DocumentModel {
    return {
        sections: [
            { kind: "title", text: content.title },
            {
                kind: "metaTable",
                rows: [
                    { label: "DURAÇÃO", value: content.duration },
                    { label: "OBJETIVOS", value: content.objective },
                    { label: "PARTICIPANTES", value: content.participants },
                    { label: "LOCAL", value: content.place },
                ],
            },
            { kind: "heading", text: "DESENVOLVIMENTO" },
            { kind: "steps", items: content.steps ?? [] },
            { kind: "heading", text: "MATERIAIS NECESSÁRIOS" },
            { kind: "bullets", items: content.materials ?? [] },
            { kind: "heading", text: "AVALIAÇÃO" },
            { kind: "paragraph", text: content.evaluation },
            { kind: "heading", text: "SEGURANÇA" },
            { kind: "paragraph", text: content.safety },
            { kind: "heading", text: "FONTES / REFERÊNCIAS" },
            { kind: "paragraph", text: content.source || "N/A" },
            { kind: "pageBreak" },
            { kind: "heading", text: "RUBRICA DE AVALIAÇÃO" },
            {
                kind: "table",
                headers: ["CRITÉRIO", "EVIDÊNCIA ESPERADA", "NÍVEL COGNITIVO (BLOOM)"],
                rows: (content.rubric ?? []).map((r) => [r.criteria, r.evidence, r.bloom]),
            },
            { kind: "heading", text: "CHECKLIST DE CONFORMIDADE (AUTOAUDITORIA)" },
            {
                kind: "table",
                headers: ["CRITÉRIO", "OK"],
                rows: (content.daily_checklist ?? []).map((c) => [c.item, c.checked ? "X" : " "]),
            },
            { kind: "heading", text: "COMENTÁRIOS E SUGESTÕES DE MELHORIA" },
            { kind: "bullets", items: content.comments ?? [] },
        ],
    };
}
