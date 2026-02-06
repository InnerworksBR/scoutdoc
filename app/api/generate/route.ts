import { NextResponse } from "next/server";
import { generatePUD, PUDData } from "@/lib/ai";
import { z } from "zod";

const generationSchema = z.object({
    linha: z.string(),
    nivel: z.string(),
    ramo: z.string(),
    titulo: z.string(),
    tema: z.string().optional(),
    duracao: z.string(),
    participantes: z.string(),
    local: z.string(),
    contexto: z.string(),
    enfase: z.string(),
    desafios: z.string(),
    observacoes: z.string().optional(),
});

import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = generationSchema.parse(body);

        const generatedContent = await generatePUD(validatedData);

        // Auto-save to database
        const { data: document, error: dbError } = await supabase
            .from("documents")
            .insert({
                user_id: user.id,
                title: generatedContent.title,
                type: "PUD",
                linha: validatedData.linha,
                status: "completed", // Since AI successfully generated it
                content: generatedContent,
            })
            .select()
            .single();

        if (dbError) {
            console.error("Error saving document:", dbError);
            // We still return the content to the user, but maybe warn them?
            // Or fail? For now, let's log and return content, but attached with an error flag if needed.
            // But prefer to fail if persistence is critical.
            throw new Error("Failed to save document to database");
        }

        return NextResponse.json({
            ...generatedContent,
            id: document.id, // Return ID for future reference/updates
        });

    } catch (error) {
        console.error("Error generating/saving PUD:", error);
        return NextResponse.json(
            { error: "Failed to generate content" },
            { status: 500 }
        );
    }
}
