import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { GeneratedContent } from "./ai";

export class DocxGenerator {
    public static async generate(content: GeneratedContent): Promise<Buffer> {
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        // Title
                        new Paragraph({
                            text: content.title.toUpperCase(),
                            heading: HeadingLevel.TITLE,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 300 },
                        }),

                        // Metadata Table
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ text: "DURAÇÃO", style: "Strong" })],
                                            width: { size: 25, type: WidthType.PERCENTAGE },
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(content.duration)],
                                        }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ text: "OBJETIVOS", style: "Strong" })],
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(content.objective)],
                                        }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ text: "PARTICIPANTES", style: "Strong" })],
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(content.participants)],
                                        }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ text: "LOCAL", style: "Strong" })],
                                        }),
                                        new TableCell({
                                            children: [new Paragraph(content.place)],
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        new Paragraph({ text: "", spacing: { before: 200 } }), // Spacer

                        // Development Header
                        new Paragraph({
                            text: "DESENVOLVIMENTO",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 200, after: 100 },
                        }),

                        // Steps
                        ...content.steps.flatMap((step) => [
                            new Paragraph({
                                text: `${step.title} (${step.time})`,
                                heading: HeadingLevel.HEADING_2,
                                spacing: { before: 100 },
                            }),
                            new Paragraph({
                                text: step.description,
                                spacing: { after: 100 },
                            }),
                        ]),

                        // Materials Header
                        new Paragraph({
                            text: "MATERIAIS NECESSÁRIOS",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 200, after: 100 },
                        }),

                        // Materials List
                        ...content.materials.map(
                            (material) =>
                                new Paragraph({
                                    text: material,
                                    bullet: { level: 0 },
                                })
                        ),

                        // Evaluation Header
                        new Paragraph({
                            text: "AVALIAÇÃO",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 200, after: 100 },
                        }),
                        new Paragraph({
                            text: content.evaluation,
                        }),

                        // Safety Header
                        new Paragraph({
                            text: "SEGURANÇA",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 200, after: 100 },
                        }),
                        new Paragraph({
                            text: content.safety,
                        }),

                        // Source Header
                        new Paragraph({
                            text: "FONTES / REFERÊNCIAS",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 200, after: 100 },
                        }),
                        new Paragraph({
                            text: content.source,
                        }),

                        // Page Break for Rubric/Checklist
                        new Paragraph({
                            text: "",
                            pageBreakBefore: true,
                        }),

                        // Rubric Header
                        new Paragraph({
                            text: "RUBRICA DE AVALIAÇÃO",
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 100, after: 200 },
                        }),

                        // Rubric Table
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                // Header Row
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ text: "CRITÉRIO", style: "Strong" })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                                        new TableCell({ children: [new Paragraph({ text: "EVIDÊNCIA ESPERADA", style: "Strong" })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                                        new TableCell({ children: [new Paragraph({ text: "NÍVEL COGNITIVO (BLOOM)", style: "Strong" })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                                    ],
                                }),
                                // Rows
                                ...content.rubric.map(item => new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(item.criteria)] }),
                                        new TableCell({ children: [new Paragraph(item.evidence)] }),
                                        new TableCell({ children: [new Paragraph(item.bloom)] }),
                                    ],
                                }))
                            ],
                        }),

                        new Paragraph({ text: "", spacing: { before: 300 } }),

                        // Checklist Header
                        new Paragraph({
                            text: "CHECKLIST DE CONFORMIDADE (AUTOAUDITORIA)",
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 100, after: 200 },
                        }),

                        // Checklist Table
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                // Header Row
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ text: "CRITÉRIO", style: "Strong" })], width: { size: 80, type: WidthType.PERCENTAGE } }),
                                        new TableCell({ children: [new Paragraph({ text: "OK", style: "Strong" })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                                    ]
                                }),
                                // Rows
                                ...content.daily_checklist.map(item => new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(item.item)] }),
                                        new TableCell({ children: [new Paragraph(item.checked ? "X" : " ")] }),
                                    ]
                                }))
                            ],
                        }),

                        new Paragraph({ text: "", spacing: { before: 300 } }),

                        // Comments Header
                        new Paragraph({
                            text: "COMENTÁRIOS E SUGESTÕES DE MELHORIA",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 100, after: 100 },
                        }),

                        // Comments List
                        ...content.comments.map(
                            (comment) =>
                                new Paragraph({
                                    text: comment,
                                    bullet: { level: 0 },
                                })
                        ),

                    ],
                },
            ],
        });

        return await Packer.toBuffer(doc);
    }
}
