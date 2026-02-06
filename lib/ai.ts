import OpenAI from "openai";

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
2. BASEADO EM PROBLEMAS: Use os "Dafios Reais" informados para contextualizar a atividade.
3. ESTRUTURA DE TEMPO: Total de 60-90 min (conforme input). Distribua em: Abertura, Desenvolvimento (Dinâmica/Prática), Debate/Reflexão, Encerramento.
4. CITAÇÕES: Use citações breves de B-P ou documentos oficiais (Ex: "Política Nacional de Adultos – Cap. 3 – p. 14").
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
