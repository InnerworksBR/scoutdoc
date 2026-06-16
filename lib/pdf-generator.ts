import PDFDocument from "pdfkit";
import { GeneratedContent } from "./ai";
import { buildPudModel, DocumentModel, Section } from "./document-model";

// ── Paleta escoteira (RGB 0-255) ──────────────────────────────────────────────
const COLORS = {
    scoutGreen: [34, 85, 34] as [number, number, number],      // scout-700 ≈
    scoutDark: [20, 55, 20] as [number, number, number],       // headings
    azure: [37, 99, 235] as [number, number, number],          // azure-600
    gold: [161, 108, 22] as [number, number, number],          // gold-700
    cream: [250, 247, 240] as [number, number, number],        // cream-50 bg
    creamBorder: [220, 210, 190] as [number, number, number],  // cream-200
    text: [30, 40, 30] as [number, number, number],            // body text
    white: [255, 255, 255] as [number, number, number],
    tableHeader: [34, 85, 34] as [number, number, number],
};

const MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export class PdfGenerator {
    public static async generate(content: GeneratedContent): Promise<Buffer> {
        const model = buildPudModel(content);
        return renderModel(model);
    }
}

function renderModel(model: DocumentModel): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: MARGIN, size: "A4" });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        for (const section of model.sections) {
            renderSection(doc, section);
        }

        doc.end();
    });
}

function renderSection(doc: PDFKit.PDFDocument, section: Section) {
    switch (section.kind) {
        case "title":
            renderTitle(doc, section.text);
            break;
        case "metaTable":
            renderMetaTable(doc, section.rows);
            break;
        case "heading":
            renderHeading(doc, section.text);
            break;
        case "steps":
            renderSteps(doc, section.items);
            break;
        case "bullets":
            renderBullets(doc, section.items);
            break;
        case "paragraph":
            renderParagraph(doc, section.text);
            break;
        case "table":
            renderTable(doc, section.headers, section.rows);
            break;
        case "pageBreak":
            doc.addPage();
            break;
    }
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderTitle(doc: PDFKit.PDFDocument, text: string) {
    doc
        .fillColor(COLORS.scoutDark)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(text.toUpperCase(), { align: "center" })
        .moveDown(0.8);
}

function renderMetaTable(doc: PDFKit.PDFDocument, rows: { label: string; value: string }[]) {
    const labelW = 130;
    const valueW = CONTENT_WIDTH - labelW;
    const rowH = 22;
    const x = MARGIN;

    for (const row of rows) {
        const y = doc.y;
        ensureSpace(doc, rowH + 2);

        // Label cell (green bg)
        doc
            .rect(x, doc.y, labelW, rowH)
            .fillAndStroke(COLORS.scoutGreen, COLORS.scoutDark);
        doc
            .fillColor(COLORS.white)
            .fontSize(8)
            .font("Helvetica-Bold")
            .text(row.label, x + 4, doc.y + 6, { width: labelW - 8, lineBreak: false });

        // Value cell (cream bg)
        doc
            .rect(x + labelW, y, valueW, rowH)
            .fillAndStroke(COLORS.cream, COLORS.creamBorder);
        doc
            .fillColor(COLORS.text)
            .fontSize(8)
            .font("Helvetica")
            .text(row.value || " ", x + labelW + 4, y + 6, { width: valueW - 8, lineBreak: false });

        doc.moveDown(0);
        doc.y = y + rowH + 1;
    }
    doc.moveDown(0.6);
}

function renderHeading(doc: PDFKit.PDFDocument, text: string) {
    ensureSpace(doc, 30);
    doc
        .fillColor(COLORS.scoutGreen)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(text, { underline: false })
        .moveDown(0.3);
    // Underline rule
    const y = doc.y;
    doc
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + CONTENT_WIDTH, y)
        .strokeColor(COLORS.scoutGreen)
        .lineWidth(0.5)
        .stroke();
    doc.moveDown(0.4);
}

function renderSteps(doc: PDFKit.PDFDocument, items: { title: string; time: string; description: string }[]) {
    for (const step of items) {
        ensureSpace(doc, 30);
        doc
            .fillColor(COLORS.azure)
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(`${step.title} (${step.time})`)
            .moveDown(0.2);
        doc
            .fillColor(COLORS.text)
            .fontSize(9)
            .font("Helvetica")
            .text(step.description || " ", { indent: 10 })
            .moveDown(0.4);
    }
}

function renderBullets(doc: PDFKit.PDFDocument, items: string[]) {
    for (const item of items) {
        ensureSpace(doc, 16);
        doc
            .fillColor(COLORS.gold)
            .fontSize(9)
            .font("Helvetica-Bold")
            .text("•", MARGIN, doc.y, { continued: true, width: 12 });
        doc
            .fillColor(COLORS.text)
            .font("Helvetica")
            .text(` ${item}`, { indent: 12 })
            .moveDown(0.15);
    }
    doc.moveDown(0.3);
}

function renderParagraph(doc: PDFKit.PDFDocument, text: string) {
    ensureSpace(doc, 16);
    doc
        .fillColor(COLORS.text)
        .fontSize(9)
        .font("Helvetica")
        .text(text || " ")
        .moveDown(0.4);
}

function renderTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]) {
    const colCount = headers.length;
    if (colCount === 0) return;

    // Equal-width columns (special case: 2-col checklist is 80/20)
    const colWidths = colCount === 2
        ? [CONTENT_WIDTH * 0.80, CONTENT_WIDTH * 0.20]
        : headers.map(() => CONTENT_WIDTH / colCount);

    const headerH = 20;
    const rowH = 18;
    const x = MARGIN;

    // Header row
    ensureSpace(doc, headerH + rowH);
    let cx = x;
    for (let i = 0; i < headers.length; i++) {
        doc
            .rect(cx, doc.y, colWidths[i], headerH)
            .fillAndStroke(COLORS.tableHeader, COLORS.scoutDark);
        doc
            .fillColor(COLORS.white)
            .fontSize(7.5)
            .font("Helvetica-Bold")
            .text(headers[i], cx + 3, doc.y + 5, { width: colWidths[i] - 6, lineBreak: false });
        cx += colWidths[i];
    }
    doc.y += headerH;

    // Data rows
    for (const row of rows) {
        ensureSpace(doc, rowH + 2);
        cx = x;
        const rowY = doc.y;
        for (let i = 0; i < colWidths.length; i++) {
            const cell = row[i] ?? "";
            doc
                .rect(cx, rowY, colWidths[i], rowH)
                .fillAndStroke(COLORS.cream, COLORS.creamBorder);
            doc
                .fillColor(COLORS.text)
                .fontSize(7.5)
                .font("Helvetica")
                .text(cell, cx + 3, rowY + 5, { width: colWidths[i] - 6, lineBreak: false });
            cx += colWidths[i];
        }
        doc.y = rowY + rowH;
    }
    doc.moveDown(0.6);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
    const bottomMargin = MARGIN;
    const pageHeight = doc.page.height;
    if (doc.y + needed > pageHeight - bottomMargin) {
        doc.addPage();
    }
}
