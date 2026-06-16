import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

const openai = new OpenAI();

// text-embedding-3-small → 1536 dimensões. Barato e suficiente para RAG de documentos.
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;

// ~2400 caracteres ≈ 500-600 palavras por chunk; 300 de sobreposição preserva contexto entre fronteiras.
const DEFAULT_MAX_CHARS = 2400;
const DEFAULT_OVERLAP = 300;

/**
 * Fragmenta um texto em chunks respeitando limites de parágrafo quando possível,
 * com sobreposição para não perder contexto nas fronteiras.
 */
export function chunkText(
    text: string,
    opts?: { maxChars?: number; overlap?: number }
): string[] {
    const maxChars = opts?.maxChars ?? DEFAULT_MAX_CHARS;
    const overlap = Math.min(opts?.overlap ?? DEFAULT_OVERLAP, Math.floor(maxChars / 2));

    const clean = text
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    if (!clean) return [];
    if (clean.length <= maxChars) return [clean];

    const paragraphs = clean.split(/\n\n+/);
    const chunks: string[] = [];
    let current = "";

    const pushCurrent = () => {
        const trimmed = current.trim();
        if (trimmed) chunks.push(trimmed);
    };

    for (const para of paragraphs) {
        // Parágrafo isolado maior que o limite → corte rígido com sobreposição
        if (para.length > maxChars) {
            pushCurrent();
            current = "";
            const step = maxChars - overlap;
            for (let i = 0; i < para.length; i += step) {
                chunks.push(para.slice(i, i + maxChars).trim());
            }
            continue;
        }

        const candidate = current ? `${current}\n\n${para}` : para;
        if (candidate.length > maxChars) {
            pushCurrent();
            // inicia novo chunk com a cauda do anterior (sobreposição) + parágrafo atual
            const tail = current.slice(-overlap);
            current = tail ? `${tail}\n\n${para}` : para;
        } else {
            current = candidate;
        }
    }
    pushCurrent();

    return chunks.filter((c) => c.length > 0);
}

/**
 * Gera embeddings para uma lista de textos, em lotes, usando a OpenAI.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const out: number[][] = [];
    const BATCH = 100;
    for (let i = 0; i < texts.length; i += BATCH) {
        const batch = texts.slice(i, i + BATCH);
        const res = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: batch,
        });
        // A API retorna na mesma ordem do input
        for (const item of res.data) out.push(item.embedding);
    }
    return out;
}

/**
 * Gera o embedding de uma única consulta (pergunta do usuário).
 */
export async function embedQuery(query: string): Promise<number[]> {
    const res = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: query.slice(0, 8000),
    });
    return res.data[0].embedding;
}

/**
 * (Re)indexa um documento: apaga chunks antigos, fragmenta o texto, gera embeddings
 * e insere os novos chunks. Usa um client com permissão de escrita (service role/admin).
 * Retorna a quantidade de chunks gerados.
 */
export async function indexDocumentChunks(
    client: SupabaseClient,
    params: { documentId: string; agentId: string; contentText: string }
): Promise<number> {
    const { documentId, agentId, contentText } = params;

    // Limpa indexação anterior deste documento (idempotente)
    await client.from("agent_document_chunks").delete().eq("document_id", documentId);

    const chunks = chunkText(contentText);
    if (chunks.length === 0) return 0;

    const embeddings = await embedTexts(chunks);

    const rows = chunks.map((content, i) => ({
        document_id: documentId,
        agent_id: agentId,
        chunk_index: i,
        content,
        embedding: embeddings[i],
    }));

    // Insere em lotes para não exceder limites de payload
    const BATCH = 200;
    for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await client
            .from("agent_document_chunks")
            .insert(rows.slice(i, i + BATCH));
        if (error) throw new Error(`Falha ao inserir chunks: ${error.message}`);
    }

    return rows.length;
}
