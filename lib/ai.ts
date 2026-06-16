import OpenAI from "openai";
import { DocumentTemplate, DynamicDocumentJson } from "./document-template";

// Initialize OpenAI Client
const openai = new OpenAI();

export interface PUDData {
    linha: string;
    nivel: string;
    ramo: string;
    titulo: string;
    tema?: string;
    duracao: string;
    participantes: string;
    local: string;
    contexto: string;
    enfase: string;
    desafios: string;
    observacoes?: string;
}

export interface GeneratedContent {
    title: string;
    objective: string;
    duration: string;
    participants: string;
    place: string;
    materials: string[];
    steps: { title: string; description: string; time: string }[];
    evaluation: string;
    safety: string;
    source: string;
    comments: string[];
    rubric: { criteria: string; evidence: string; bloom: string }[];
    daily_checklist: { item: string; checked: boolean }[];
}

const SYSTEM_PROMPT = `
Você é um Chefe Escoteiro Escotista e Dirigente da União dos Escoteiros do Brasil (UEB), com formação em Pedagogia e Andragogia.
Você domina integralmente:
- POR (Princípios, Organização e Regras)
- Política Nacional de Adultos (PNAME)
- Matriz de Conteúdo do Sistema de Formação
- Método Escoteiro (Aprender Fazendo, Vida em Equipe)

SEU OBJETIVO:
Criar um Plano de Unidade Didática (PUD) técnico, andragógico e aplicável, seguindo rigorosamente os padrões da UEB.

REGRAS OBRIGATÓRIAS:
1. FOCO ANDRAGÓGICO: Conteúdo focado no adulto (se Linha Dirigente/Escotista) ou adequado à faixa etária (se Ramo).
2. BASEADO EM PROBLEMAS: Use os "Desafios Reais" informados para contextualizar a atividade.
3. ESTRUTURA DE TEMPO: Total de 60-90 min (conforme input). Distribua em: Abertura, Desenvolvimento (Dinâmica/Prática), Debate/Reflexão, Encerramento.
4. CITAÇÕES NO CAMPO "source": Preencha APENAS com referências verificáveis de documentos oficiais conhecidos da UEB (ex.: "Política Nacional de Adultos (PNAME) – Cap. 3, p. 14", "Princípios, Organização e Regras (POR) – Seção 4.2", "Matriz de Conteúdo do Sistema de Formação – UEB, 2022"). NUNCA invente títulos, capítulos, páginas ou códigos. Se não houver referência verificável, use exatamente: "N/A".
5. SEGURANÇA: Inclua proteção infantojuvenil e gestão de risco.

SAÍDA ESPERADA (JSON):
{
  "title": "Título Oficial e Técnico",
  "objective": "Objetivos claros (Bloom) e conectados às competências",
  "duration": "Tempo total",
  "participants": "Quantidade/Perfil",
  "place": "Local sugerido",
  "materials": ["Lista", "quantificada", "de materiais"],
  "steps": [
    { "title": "Abertura", "description": "Detalhes...", "time": "15 min" },
    { "title": "Dinâmica Principal", "description": "Detalhes técnicos...", "time": "45 min" }
  ],
  "evaluation": "Como avaliar (observação, feedback)",
  "safety": "Medidas de segurança e proteção",
  "source": "Referências bibliográficas oficiais",
  "comments": ["Crítica 1 para melhoria", "Crítica 2", "Crítica 3"],
  "rubric": [
    { "criteria": "Critério 1", "evidence": "Evidência observável", "bloom": "Nível Cognitivo" }
  ],
  "daily_checklist": [
    { "item": "Usou PUD-Modelo", "checked": false },
    { "item": "Andragogia aplicada", "checked": false }
  ]
}
`;

export async function generatePUD(data: PUDData): Promise<GeneratedContent> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    const userPrompt = `
DADOS DA SOLICITAÇÃO:
- Título: ${data.titulo}
- Linha: ${data.linha}
- Ramo: ${data.ramo}
- Nível: ${data.nivel}
- Tema/Ênfase: ${data.tema} / ${data.enfase}
- Contexto: ${data.contexto}
- Desafios Reais: ${data.desafios}
- Observações: ${data.observacoes || "Nenhuma"}
- Duração: ${data.duracao}
- Participantes: ${data.participantes}
- Local: ${data.local}

Gere o PUD completo, incluindo Rubrica de Avaliação e Checklist de Autoauditoria.
`.trim();

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content returned from OpenAI");
        }

        const parsedData = JSON.parse(content) as GeneratedContent;
        return parsedData;

    } catch (error) {
        console.error("OpenAI Generation Error:", error);
        throw error;
    }
}

// ── Free-form Document Generation (impl. 009 — dirigido pelo system prompt) ───

/**
 * Gera um documento completo em Markdown seguindo as instruções do próprio agente
 * (system prompt) e a conversa atual. O Markdown é depois convertido em PDF/DOCX.
 */
export async function generateFreeformDocument(
    agentSystemPrompt: string,
    history: { role: "user" | "assistant"; content: string }[],
    docs: { name: string; text: string }[],
    title?: string,
    model: string = "gpt-4o"
): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    const MAX_CHARS_PER_DOC = 8000;
    const docsContext =
        docs.length > 0
            ? `\n\n## DOCUMENTOS DE REFERÊNCIA\n${docs
                  .map((d) => `\n=== ${d.name} ===\n${d.text.slice(0, MAX_CHARS_PER_DOC)}`)
                  .join("")}`
            : "";

    const systemPrompt = `${agentSystemPrompt}

## TAREFA: GERAR DOCUMENTO FINAL
Com base em TODA a conversa acima e seguindo rigorosamente as suas instruções de especialista, produza um documento final completo, formal e bem estruturado em **Markdown**.

Regras de formatação:
- Comece com um título de nível 1 (uma linha "# Título do Documento").
- Use "##" e "###" para seções e subseções.
- Use listas com "-" e tabelas em Markdown quando fizer sentido.
- Entregue apenas o documento pronto — sem frases como "aqui está" ou comentários fora do documento.
${title ? `- Título sugerido: "${title}".` : ""}${docsContext}`;

    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map((m) => ({
        role: m.role,
        content: m.content,
    }));

    const completion = await openai.chat.completions.create({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: "Gere agora o documento final completo em Markdown, com base em toda a conversa acima." },
        ],
        temperature: 0.5,
    });

    const md = completion.choices[0].message.content?.trim();
    if (!md) throw new Error("FREEFORM_DOCUMENT_FAILED");
    return md;
}

// ── Structured Document Generation (impl. 004) ────────────────────────────────

export async function generateStructuredDocument(
    template: DocumentTemplate,
    history: { role: "user" | "assistant"; content: string }[],
    docs: { name: string; text: string }[],
    model: string = "gpt-4o"
): Promise<DynamicDocumentJson> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    const sectionsDescription = template.sections
        .map((sec) => {
            const base = `- Key: "${sec.key}" | Rótulo: "${sec.label}" | Tipo: "${sec.type}"\n  Instrução: ${sec.instruction}`;
            return sec.type === "tabela" && sec.columns?.length
                ? base + `\n  Colunas: ${sec.columns.join(", ")}`
                : base;
        })
        .join("\n\n");

    const MAX_CHARS_PER_DOC = 8000;
    const docsContext =
        docs.length > 0
            ? `\n\n## DOCUMENTOS DE REFERÊNCIA\n${docs
                  .map((d) => `\n=== ${d.name} ===\n${d.text.slice(0, MAX_CHARS_PER_DOC)}`)
                  .join("")}`
            : "";

    const citationRule =
        docs.length > 0
            ? `\n\nCITAÇÕES: Quando usar informação de um documento, registre em "citations": [{ "section": "<key>", "source": "<nome_exato>" }]. Cite apenas fontes reais listadas acima.`
            : `\n\nCITAÇÕES: Não há documentos. Retorne "citations": [].`;

    const jsonExample: Record<string, unknown> = {};
    for (const sec of template.sections) {
        if (sec.type === "texto") jsonExample[sec.key] = { type: "texto", value: "..." };
        else if (sec.type === "lista") jsonExample[sec.key] = { type: "lista", value: ["...", "..."] };
        else jsonExample[sec.key] = { type: "tabela", columns: sec.columns ?? [], rows: [Array(sec.columns?.length ?? 1).fill("...")] };
    }

    const systemPrompt = `Você é um assistente especialista em documentação formal. Com base na conversa fornecida, produza um documento JSON estruturado conforme o template.

## TEMPLATE
Título: ${template.title || "Documento"}

## SEÇÕES
${sectionsDescription}

## FORMATO JSON OBRIGATÓRIO
{
  "title": "${template.title || "Documento"}",
  "sections": ${JSON.stringify(jsonExample, null, 2)},
  "citations": []
}

Preencha TODAS as seções usando EXATAMENTE as keys definidas. Não omita nenhuma seção.${citationRule}${docsContext}`;

    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map((m) => ({
        role: m.role,
        content: m.content,
    }));

    const attempt = async (): Promise<DynamicDocumentJson> => {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                ...historyMessages,
                { role: "user", content: "Com base na conversa acima, gere o documento JSON agora." },
            ],
            response_format: { type: "json_object" },
        });

        const raw = completion.choices[0].message.content;
        if (!raw) throw new Error("No content from OpenAI");

        const json = JSON.parse(raw) as DynamicDocumentJson;

        const missing = template.sections.filter((s) => !json.sections?.[s.key]);
        if (missing.length > 0) {
            throw new Error(`Missing sections: ${missing.map((s) => s.key).join(", ")}`);
        }

        return json;
    };

    try {
        return await attempt();
    } catch {
        try {
            return await attempt();
        } catch (err) {
            console.error("generateStructuredDocument failed after retry:", err);
            throw new Error("STRUCTURED_DOCUMENT_FAILED");
        }
    }
}
