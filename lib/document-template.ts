import { z } from "zod";
import { Section } from "./document-model";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SectionType = "texto" | "lista" | "tabela";

export interface DocumentSection {
    key: string;
    label: string;
    instruction: string;
    type: SectionType;
    columns?: string[];
}

export interface DocumentTemplate {
    title?: string;
    sections: DocumentSection[];
}

// GPT-4o dynamic output shapes
export interface DynamicSectionValue {
    type: SectionType;
    value?: string | string[];
    columns?: string[];
    rows?: string[][];
}

export interface DynamicDocumentJson {
    title?: string;
    sections: Record<string, DynamicSectionValue>;
    citations?: { section: string; source: string }[];
}

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const documentSectionSchema = z
    .object({
        key: z.string().min(1, "key é obrigatória"),
        label: z.string().min(1, "label é obrigatório"),
        instruction: z.string().min(1, "instruction é obrigatória"),
        type: z.enum(["texto", "lista", "tabela"]),
        columns: z.array(z.string().min(1)).optional(),
    })
    .refine(
        (s) => s.type !== "tabela" || (Array.isArray(s.columns) && s.columns.length > 0),
        { message: "Seção do tipo 'tabela' deve ter ao menos uma coluna." }
    );

export const documentTemplateSchema = z.object({
    title: z.string().optional(),
    sections: z.array(documentSectionSchema).min(1, "O template deve ter ao menos uma seção."),
});

// ── Mapper: dynamic JSON → generic Section[] ─────────────────────────────────

export function mapDynamicJsonToSections(
    template: DocumentTemplate,
    json: DynamicDocumentJson
): Section[] {
    const sections: Section[] = [];

    const title = json.title ?? template.title ?? "Documento";
    sections.push({ kind: "title", text: title });

    for (const tmplSection of template.sections) {
        sections.push({ kind: "heading", text: tmplSection.label.toUpperCase() });

        const raw = json.sections?.[tmplSection.key];

        if (!raw) {
            if (tmplSection.type === "texto") {
                sections.push({ kind: "paragraph", text: "" });
            } else if (tmplSection.type === "lista") {
                sections.push({ kind: "bullets", items: [] });
            } else {
                sections.push({ kind: "table", headers: tmplSection.columns ?? [], rows: [] });
            }
            continue;
        }

        if (tmplSection.type === "texto") {
            const text = typeof raw.value === "string" ? raw.value : "";
            sections.push({ kind: "paragraph", text });
        } else if (tmplSection.type === "lista") {
            const items = Array.isArray(raw.value)
                ? (raw.value as string[])
                : typeof raw.value === "string"
                ? [raw.value]
                : [];
            sections.push({ kind: "bullets", items });
        } else {
            const headers = Array.isArray(raw.columns) && raw.columns.length > 0
                ? raw.columns
                : (tmplSection.columns ?? []);
            const rows = Array.isArray(raw.rows) ? raw.rows : [];
            sections.push({ kind: "table", headers, rows });
        }
    }

    const citations = json.citations ?? [];
    if (citations.length > 0) {
        const sources = [...new Set(citations.map((c) => c.source).filter(Boolean))];
        if (sources.length > 0) {
            sections.push({ kind: "heading", text: "FONTES / REFERÊNCIAS" });
            sections.push({ kind: "bullets", items: sources });
        }
    }

    return sections;
}

// ── Preview formatter ─────────────────────────────────────────────────────────

export function formatPreviewContent(json: DynamicDocumentJson, template: DocumentTemplate): string {
    const title = json.title ?? template.title ?? "Documento";
    let text = `${title}\n${"=".repeat(Math.min(title.length, 60))}\n\n`;

    for (const sec of template.sections) {
        const raw = json.sections?.[sec.key];
        text += `${sec.label.toUpperCase()}\n${"-".repeat(Math.min(sec.label.length, 60))}\n`;

        if (!raw) {
            text += "(sem conteúdo)\n\n";
            continue;
        }

        if (sec.type === "texto") {
            text += `${raw.value || ""}\n\n`;
        } else if (sec.type === "lista") {
            const items = Array.isArray(raw.value) ? (raw.value as string[]) : [];
            text += items.map((i) => `• ${i}`).join("\n") + "\n\n";
        } else {
            const cols = Array.isArray(raw.columns) && raw.columns.length > 0
                ? raw.columns
                : (sec.columns ?? []);
            const rows = Array.isArray(raw.rows) ? raw.rows : [];
            text += cols.join(" | ") + "\n";
            if (rows.length > 0) {
                text += rows.map((r) => r.join(" | ")).join("\n") + "\n\n";
            } else {
                text += "(sem linhas)\n\n";
            }
        }
    }

    const cits = json.citations?.filter((c) => c.source) ?? [];
    if (cits.length > 0) {
        text += "FONTES / REFERÊNCIAS\n--------------------\n";
        const sources = [...new Set(cits.map((c) => c.source))];
        text += sources.map((s) => `• ${s}`).join("\n");
    }

    return text;
}
