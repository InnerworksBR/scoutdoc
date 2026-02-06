import { NextResponse } from "next/server";
import { DocxGenerator } from "@/lib/docx-generator";
import { GeneratedContent } from "@/lib/ai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // In a real app, validate body with Zod schema for GeneratedContent
        const content = body as GeneratedContent;

        const buffer = await DocxGenerator.generate(content);

        // Create a new response with the buffer
        // Fix: Wrap buffer in Blob to satisfy BodyInit type
        const response = new NextResponse(new Blob([buffer as any]));

        // Set headers for file download
        response.headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        response.headers.set(
            "Content-Disposition",
            `attachment; filename="${content.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx"`
        );

        return response;
    } catch (error) {
        console.error("Error generating DOCX:", error);
        return NextResponse.json(
            { error: "Failed to generate document" },
            { status: 500 }
        );
    }
}
