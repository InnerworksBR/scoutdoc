// Modelos de chat da OpenAI oferecidos na configuração do agente.
// Lista curada com os modelos atuais (jun/2026) + gerações anteriores p/ compatibilidade.
// Todos os listados suportam visão (imagem no chat) e structured outputs (json_object).
export interface GptModelOption {
    value: string;
    label: string;
    hint: string;
}

export const GPT_MODELS: GptModelOption[] = [
    // ── Geração atual (família GPT-5) ──
    { value: "gpt-5.5", label: "GPT-5.5", hint: "Mais capaz, topo de linha" },
    { value: "gpt-5.4", label: "GPT-5.4", hint: "Equilíbrio entre qualidade e custo" },
    { value: "gpt-5.4-mini", label: "GPT-5.4 mini", hint: "Rápido e econômico" },
    { value: "gpt-5.4-nano", label: "GPT-5.4 nano", hint: "O mais rápido/barato (visão limitada)" },
    // ── Gerações anteriores (compatibilidade) ──
    { value: "gpt-4.1", label: "GPT-4.1", hint: "Geração anterior, capaz" },
    { value: "gpt-4o", label: "GPT-4o", hint: "Geração anterior, equilibrado" },
    { value: "gpt-4o-mini", label: "GPT-4o mini", hint: "Geração anterior, econômico" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo", hint: "Geração antiga" },
];

export const DEFAULT_GPT_MODEL = "gpt-4o";

/** Garante um modelo válido (cai no default se vazio). */
export function resolveModel(model?: string | null): string {
    const m = (model ?? "").trim();
    return m || DEFAULT_GPT_MODEL;
}

/**
 * Modelos "de raciocínio" (família GPT-5 e o-series) têm contratos de API diferentes:
 * usam `max_completion_tokens` (não `max_tokens`), não aceitam `temperature` customizada
 * e suportam `reasoning_effort`. Detectamos pelo prefixo do ID.
 */
export function isReasoningStyle(model: string): boolean {
    return /^(o\d|gpt-5)/i.test(model.trim());
}

export interface ChatParamsInput {
    model: string;
    messages: unknown;
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: unknown;
    reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
}

/**
 * Monta o corpo da chamada `chat.completions.create` com os parâmetros corretos
 * para a família do modelo, evitando erros de parâmetro não suportado.
 */
export function buildChatParams(input: ChatParamsInput): Record<string, unknown> {
    const params: Record<string, unknown> = {
        model: input.model,
        messages: input.messages,
    };
    if (input.stream) params.stream = true;
    if (input.responseFormat) params.response_format = input.responseFormat;

    if (isReasoningStyle(input.model)) {
        // GPT-5 / o-series: limite de saída via max_completion_tokens; sem temperature.
        if (input.maxTokens) params.max_completion_tokens = input.maxTokens;
        if (input.reasoningEffort) params.reasoning_effort = input.reasoningEffort;
    } else {
        // GPT-4.x e anteriores: parâmetros clássicos.
        if (input.maxTokens) params.max_tokens = input.maxTokens;
        if (input.temperature !== undefined) params.temperature = input.temperature;
    }
    return params;
}
