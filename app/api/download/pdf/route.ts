import { NextResponse } from "next/server";
import { PdfGenerator } from "@/lib/pdf-generator";
import { generatedContentSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = generatedContentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
                { status: 400 }
            );
        }

        const buffer = await PdfGenerator.generate(parsed.data);
        const filename = parsed.data.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

        const response = new NextResponse(new Blob([buffer as any]));
        response.headers.set("Content-Type", "application/pdf");
        response.headers.set("Content-Disposition", `attachment; filename="${filename}.pdf"`);
        return response;

    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
    }
}
