import { Section } from "./document-model";

/** Remove marcação inline do markdown, deixando texto limpo para o PDF/DOCX. */
function stripInline(s: string): string {
    return s
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/\[Fonte:\s*([^\]]+?)\s*\]/g, "(Fonte: $1)")
        .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
        .trim();
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l: string) => l.includes("-") && /^\s*\|?[\s:|-]+\|?\s*$/.test(l);

function parseTableRow(l: string): string[] {
    return l
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => stripInline(c.trim()));
}

/**
 * Converte um documento em Markdown nas seções genéricas do motor de documentos
 * (impl. 003), reaproveitadas pelos geradores de PDF e DOCX.
 */
export function markdownToSections(md: string): Section[] {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const sections: Section[] = [];

    let para: string[] = [];
    let bullets: string[] = [];

    const flushPara = () => {
        if (para.length) {
            const text = stripInline(para.join(" ").trim());
            if (text) sections.push({ kind: "paragraph", text });
            para = [];
        }
    };
    const flushBullets = () => {
        if (bullets.length) {
            const items = bullets.map(stripInline).filter(Boolean);
            if (items.length) sections.push({ kind: "bullets", items });
            bullets = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trim();

        // Tabela GFM: linha de cabeçalho seguida de linha separadora
        if (isTableRow(raw) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            flushPara();
            flushBullets();
            const headers = parseTableRow(raw);
            const rows: string[][] = [];
            i += 1; // pula separador
            while (i + 1 < lines.length && isTableRow(lines[i + 1])) {
                i += 1;
                rows.push(parseTableRow(lines[i]));
            }
            sections.push({ kind: "table", headers, rows });
            continue;
        }

        if (!line) {
            flushPara();
            flushBullets();
            continue;
        }

        // Cabeçalhos
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
            flushPara();
            flushBullets();
            const level = h[1].length;
            const text = stripInline(h[2]);
            if (text) sections.push(level === 1 ? { kind: "title", text } : { kind: "heading", text });
            continue;
        }

        // Linha horizontal
        if (/^(\*\*\*|---|___)\s*$/.test(line)) {
            flushPara();
            flushBullets();
            continue;
        }

        // Listas com marcador
        const b = line.match(/^[-*+]\s+(.*)$/);
        if (b) {
            flushPara();
            bullets.push(b[1]);
            continue;
        }

        // Listas numeradas → tratadas como bullets, preservando o número
        const n = line.match(/^(\d+)\.\s+(.*)$/);
        if (n) {
            flushPara();
            bullets.push(`${n[1]}. ${n[2]}`);
            continue;
        }

        // Citação em bloco
        const bq = line.match(/^>\s?(.*)$/);
        if (bq) {
            flushBullets();
            para.push(bq[1]);
            continue;
        }

        // Texto normal
        flushBullets();
        para.push(line);
    }

    flushPara();
    flushBullets();

    return sections;
}
