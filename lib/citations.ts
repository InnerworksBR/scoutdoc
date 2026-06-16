export type CitationSegment =
    | { type: "text"; value: string }
    | { type: "citation"; source: string };

export interface ParsedCitations {
    segments: CitationSegment[];
    references: string[];
}

// Matches [Fonte: nome-do-arquivo.ext] — tolerant to spaces around the name
const CITATION_RE = /\[Fonte:\s*([^\]]+?)\s*\]/g;

export function parseCitations(content: string): ParsedCitations {
    const segments: CitationSegment[] = [];
    const references: string[] = [];
    const seen = new Set<string>();

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    CITATION_RE.lastIndex = 0;

    while ((match = CITATION_RE.exec(content)) !== null) {
        const before = content.slice(lastIndex, match.index);
        if (before) {
            segments.push({ type: "text", value: before });
        }

        const raw = match[1].trim();
        // Empty or whitespace-only source → treat whole token as text
        if (!raw) {
            segments.push({ type: "text", value: match[0] });
        } else {
            segments.push({ type: "citation", source: raw });
            const key = raw.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                references.push(raw);
            }
        }

        lastIndex = match.index + match[0].length;
    }

    // Remaining text after last match (or entire string if no matches)
    const tail = content.slice(lastIndex);
    if (tail) {
        segments.push({ type: "text", value: tail });
    }

    return { segments, references };
}
