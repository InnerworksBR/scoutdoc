// Modelos de chat da OpenAI oferecidos na configuração do agente.
// Todos suportam streaming, visão (imagem no chat) e response_format json_object.
export interface GptModelOption {
    value: string;
    label: string;
    hint: string;
}

export const GPT_MODELS: GptModelOption[] = [
    { value: "gpt-4o", label: "GPT-4o", hint: "Equilíbrio entre qualidade e custo (recomendado)" },
    { value: "gpt-4o-mini", label: "GPT-4o mini", hint: "Mais rápido e econômico" },
    { value: "gpt-4.1", label: "GPT-4.1", hint: "Mais capaz para tarefas complexas" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini", hint: "Rápido, bom custo-benefício" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo", hint: "Geração anterior" },
];

export const DEFAULT_GPT_MODEL = "gpt-4o";

/** Garante um modelo válido (cai no default se vazio/desconhecido não for permitido). */
export function resolveModel(model?: string | null): string {
    const m = (model ?? "").trim();
    return m || DEFAULT_GPT_MODEL;
}
