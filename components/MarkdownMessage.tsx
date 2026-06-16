"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CitationBadge, { ReferenceFooter } from "@/components/CitationBadge";
import { parseCitations } from "@/lib/citations";

// Mesmo padrão de lib/citations.ts — usado aqui para fatiar texto inline.
const CITATION_RE = /\[Fonte:\s*([^\]]+?)\s*\]/g;

/**
 * Substitui marcadores [Fonte: nome] dentro de uma string por badges de citação,
 * usando o mapa de índices das referências já coletadas.
 */
function renderStringWithCitations(
    text: string,
    indexMap: Map<string, number>,
    keyPrefix: string
): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let i = 0;

    CITATION_RE.lastIndex = 0;
    while ((match = CITATION_RE.exec(text)) !== null) {
        const before = text.slice(lastIndex, match.index);
        if (before) nodes.push(before);

        const source = match[1].trim();
        if (source) {
            const idx = indexMap.get(source.toLowerCase());
            nodes.push(
                <CitationBadge key={`${keyPrefix}-cit-${i}`} source={source} index={idx} />
            );
        } else {
            nodes.push(match[0]);
        }
        i += 1;
        lastIndex = match.index + match[0].length;
    }

    const tail = text.slice(lastIndex);
    if (tail) nodes.push(tail);
    return nodes;
}

/**
 * Percorre os filhos de um elemento renderizado pelo markdown e troca citações
 * em nós de texto por badges. Mantém os demais elementos intactos.
 */
function processChildren(
    children: React.ReactNode,
    indexMap: Map<string, number>,
    keyPrefix = "c"
): React.ReactNode {
    return React.Children.map(children, (child, i) => {
        if (typeof child === "string") {
            const parts = renderStringWithCitations(child, indexMap, `${keyPrefix}-${i}`);
            return <React.Fragment key={i}>{parts}</React.Fragment>;
        }
        return child;
    });
}

export default function MarkdownMessage({ content }: { content: string }) {
    const { references } = parseCitations(content);
    const indexMap = new Map<string, number>();
    references.forEach((ref, i) => indexMap.set(ref.toLowerCase(), i));

    const withCitations = (children: React.ReactNode) => processChildren(children, indexMap);

    return (
        <div className="markdown-body text-sm leading-relaxed text-scout-800">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-lg font-bold text-scout-900 mt-3 mb-1.5 first:mt-0">{withCitations(children)}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-base font-bold text-scout-900 mt-3 mb-1.5 first:mt-0">{withCitations(children)}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-sm font-bold text-scout-900 mt-2.5 mb-1 first:mt-0">{withCitations(children)}</h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-sm font-semibold text-scout-900 mt-2 mb-1 first:mt-0">{withCitations(children)}</h4>
                    ),
                    p: ({ children }) => (
                        <p className="mb-2 last:mb-0 leading-relaxed">{withCitations(children)}</p>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-relaxed">{withCitations(children)}</li>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-semibold text-scout-900">{withCitations(children)}</strong>
                    ),
                    em: ({ children }) => <em className="italic">{withCitations(children)}</em>,
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-azure-600 underline hover:text-azure-700"
                        >
                            {children}
                        </a>
                    ),
                    code: ({ className, children }) => {
                        const isBlock = className?.includes("language-");
                        if (isBlock) {
                            return (
                                <code className={`${className} block`}>{children}</code>
                            );
                        }
                        return (
                            <code className="px-1.5 py-0.5 rounded bg-cream-100 text-scout-700 text-xs font-mono">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="bg-scout-900 text-cream-50 p-3 rounded-lg overflow-x-auto text-xs mb-2 font-mono">
                            {children}
                        </pre>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-scout-300 pl-3 italic text-scout-600 my-2">
                            {children}
                        </blockquote>
                    ),
                    hr: () => <hr className="my-3 border-cream-200" />,
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                            <table className="w-full text-xs border-collapse">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-cream-100">{children}</thead>,
                    th: ({ children }) => (
                        <th className="border border-cream-200 px-2 py-1 text-left font-semibold text-scout-700">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-cream-200 px-2 py-1 align-top">{withCitations(children)}</td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
            <ReferenceFooter references={references} />
        </div>
    );
}
