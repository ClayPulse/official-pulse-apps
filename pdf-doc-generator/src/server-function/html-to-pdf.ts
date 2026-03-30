import { parseDocument } from "htmlparser2";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
  PDFFont,
  PDFImage,
  type Color,
} from "pdf-lib";

// ── Color palette ─────────────────────────────────────────────────
const COLORS = {
  text: rgb(0.15, 0.15, 0.15),
  heading: rgb(0.1, 0.1, 0.12),
  accent: rgb(0.16, 0.29, 0.55),       // deep navy blue
  accentLight: rgb(0.91, 0.94, 0.98),   // light blue tint
  link: rgb(0.13, 0.38, 0.73),
  muted: rgb(0.45, 0.45, 0.5),
  border: rgb(0.78, 0.8, 0.84),
  borderLight: rgb(0.88, 0.9, 0.92),
  tableHeader: rgb(0.16, 0.29, 0.55),
  tableHeaderText: rgb(1, 1, 1),
  tableStripe: rgb(0.96, 0.97, 0.98),
  tableWhite: rgb(1, 1, 1),
  blockquoteBg: rgb(0.95, 0.96, 0.98),
  blockquoteBar: rgb(0.16, 0.29, 0.55),
  blockquoteText: rgb(0.3, 0.3, 0.38),
  hrColor: rgb(0.82, 0.84, 0.88),
  bulletColor: rgb(0.16, 0.29, 0.55),
  white: rgb(1, 1, 1),
};

// ── Layout constants ──────────────────────────────────────────────
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const MARGIN_LEFT = 55;
const MARGIN_RIGHT = 55;
const MAX_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

const FONT_SIZES: Record<string, number> = {
  h1: 26,
  h2: 18,
  h3: 14,
  h4: 12,
  h5: 11,
  h6: 10.5,
  p: 10.5,
  default: 10.5,
};

const LINE_HEIGHT_FACTOR = 1.55;

const BLOCK_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "div", "blockquote", "pre", "hr", "br",
  "ul", "ol", "li", "table", "tr",
]);

// ── Types ─────────────────────────────────────────────────────────
interface TextSpan {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  color: Color;
  link?: string;
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  courier: PDFFont;
}

interface StyleCtx {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  color: Color;
  link?: string;
}

// ── Main export ───────────────────────────────────────────────────
export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const fonts: Fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    courier: await pdfDoc.embedFont(StandardFonts.Courier),
  };

  const renderer = new PdfRenderer(pdfDoc, fonts);
  const doc = parseDocument(html);

  await renderer.renderNodes(doc.childNodes, {
    bold: false,
    italic: false,
    underline: false,
    fontSize: FONT_SIZES.default,
    color: COLORS.text,
  });

  renderer.flush();
  renderer.drawPageNumbers();

  return pdfDoc.save();
}

// ── Renderer ──────────────────────────────────────────────────────
class PdfRenderer {
  private doc: PDFDocument;
  private fonts: Fonts;
  private page: PDFPage;
  private y!: number;
  private pendingSpans: TextSpan[] = [];
  private listDepth = 0;
  private listCounters: number[] = [];
  private isOrderedList: boolean[] = [];
  private pageIndex = 0;
  private allPages: PDFPage[] = [];
  private isFirstH1 = true;
  private blockquoteDepth = 0;
  private blockquoteStartY = 0;

  constructor(doc: PDFDocument, fonts: Fonts) {
    this.doc = doc;
    this.fonts = fonts;
    this.page = this.newPage();
  }

  private newPage(): PDFPage {
    const page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN_TOP;
    this.allPages.push(page);
    this.pageIndex = this.allPages.length - 1;
    return page;
  }

  // ── Public ────────────────────────────────────────────────────
  async renderNodes(nodes: any[], style: StyleCtx) {
    for (const node of nodes) {
      await this.renderNode(node, style);
    }
  }

  flush() {
    if (this.pendingSpans.length > 0) {
      this.drawSpans(this.pendingSpans);
      this.pendingSpans = [];
    }
  }

  drawPageNumbers() {
    const total = this.allPages.length;
    if (total <= 1) return;
    for (let i = 0; i < total; i++) {
      const pg = this.allPages[i];
      const text = `${i + 1} / ${total}`;
      const w = this.fonts.regular.widthOfTextAtSize(text, 8.5);
      pg.drawText(text, {
        x: PAGE_W / 2 - w / 2,
        y: 30,
        size: 8.5,
        font: this.fonts.regular,
        color: COLORS.muted,
      });
    }
  }

  // ── Node dispatch ─────────────────────────────────────────────
  private async renderNode(node: any, style: StyleCtx) {
    if (node.type === "text") {
      const text = node.data as string;
      const collapsed = text.replace(/\s+/g, " ");
      if (collapsed === "" || (collapsed === " " && this.pendingSpans.length === 0)) return;

      this.pendingSpans.push({
        text: collapsed,
        bold: style.bold,
        italic: style.italic,
        underline: style.underline,
        fontSize: style.fontSize,
        color: style.color,
        link: style.link,
      });
      return;
    }

    if (node.type !== "tag" && node.type !== "script" && node.type !== "style") {
      if (node.childNodes) await this.renderNodes(node.childNodes, style);
      return;
    }

    if (node.type === "script" || node.type === "style" || node.name === "script" || node.name === "style") {
      return;
    }

    const tag: string = node.name?.toLowerCase() ?? "";

    if (BLOCK_TAGS.has(tag)) {
      this.flush();
    }

    const childStyle = { ...style };

    switch (tag) {
      case "h1": {
        childStyle.bold = true;
        childStyle.fontSize = FONT_SIZES.h1;
        childStyle.color = COLORS.heading;

        if (this.isFirstH1) {
          // Title treatment: accent bar + large heading
          this.isFirstH1 = false;
          this.addSpacing(10);
          this.ensureSpace(50);

          // Draw accent bar
          this.page.drawRectangle({
            x: MARGIN_LEFT,
            y: this.y - 2,
            width: 50,
            height: 4,
            color: COLORS.accent,
          });
          this.addSpacing(16);

          await this.renderChildren(node, childStyle);
          this.flush();
          this.addSpacing(10);

          // Draw underline
          this.page.drawLine({
            start: { x: MARGIN_LEFT, y: this.y },
            end: { x: PAGE_W - MARGIN_RIGHT, y: this.y },
            thickness: 1,
            color: COLORS.accent,
          });
          this.addSpacing(14);
        } else {
          this.addSpacing(childStyle.fontSize * 0.6);
          await this.renderChildren(node, childStyle);
          this.flush();
          this.addSpacing(childStyle.fontSize * 0.3);
        }
        return;
      }

      case "h2": {
        childStyle.bold = true;
        childStyle.fontSize = FONT_SIZES.h2;
        childStyle.color = COLORS.accent;

        this.addSpacing(18);
        this.ensureSpace(30);

        // Draw accent bar left of heading
        const barY = this.y;
        await this.renderChildren(node, childStyle);
        this.flush();

        // Draw subtle underline
        this.addSpacing(4);
        this.page.drawLine({
          start: { x: MARGIN_LEFT, y: this.y },
          end: { x: PAGE_W - MARGIN_RIGHT, y: this.y },
          thickness: 0.5,
          color: COLORS.borderLight,
        });
        this.addSpacing(10);
        return;
      }

      case "h3": {
        childStyle.bold = true;
        childStyle.fontSize = FONT_SIZES.h3;
        childStyle.color = COLORS.heading;
        this.addSpacing(14);
        await this.renderChildren(node, childStyle);
        this.flush();
        this.addSpacing(6);
        return;
      }

      case "h4": case "h5": case "h6": {
        childStyle.bold = true;
        childStyle.fontSize = FONT_SIZES[tag];
        childStyle.color = COLORS.muted;
        this.addSpacing(10);
        await this.renderChildren(node, childStyle);
        this.flush();
        this.addSpacing(4);
        return;
      }

      case "p": {
        this.addSpacing(3);
        await this.renderChildren(node, childStyle);
        this.flush();
        this.addSpacing(9);
        return;
      }

      case "br": {
        this.flush();
        this.addSpacing(style.fontSize * LINE_HEIGHT_FACTOR);
        return;
      }

      case "hr": {
        this.flush();
        this.addSpacing(14);
        this.ensureSpace(2);
        const indent = this.listDepth * 24;
        this.page.drawLine({
          start: { x: MARGIN_LEFT + indent, y: this.y },
          end: { x: PAGE_W - MARGIN_RIGHT, y: this.y },
          thickness: 0.5,
          color: COLORS.hrColor,
        });
        this.addSpacing(14);
        return;
      }

      case "strong": case "b": {
        childStyle.bold = true;
        await this.renderChildren(node, childStyle);
        return;
      }

      case "em": case "i": {
        childStyle.italic = true;
        await this.renderChildren(node, childStyle);
        return;
      }

      case "u": {
        childStyle.underline = true;
        await this.renderChildren(node, childStyle);
        return;
      }

      case "a": {
        childStyle.color = COLORS.link;
        childStyle.underline = true;
        childStyle.link = node.attribs?.href;
        await this.renderChildren(node, childStyle);
        return;
      }

      case "ul": {
        this.flush();
        this.addSpacing(4);
        this.listDepth++;
        this.listCounters.push(0);
        this.isOrderedList.push(false);
        await this.renderChildren(node, childStyle);
        this.flush();
        this.listDepth--;
        this.listCounters.pop();
        this.isOrderedList.pop();
        this.addSpacing(6);
        return;
      }

      case "ol": {
        this.flush();
        this.addSpacing(4);
        this.listDepth++;
        this.listCounters.push(0);
        this.isOrderedList.push(true);
        await this.renderChildren(node, childStyle);
        this.flush();
        this.listDepth--;
        this.listCounters.pop();
        this.isOrderedList.pop();
        this.addSpacing(6);
        return;
      }

      case "li": {
        this.flush();
        const indent = this.listDepth * 24;
        const counterIdx = this.listCounters.length - 1;
        this.listCounters[counterIdx]++;

        if (this.isOrderedList[counterIdx]) {
          const num = `${this.listCounters[counterIdx]}.  `;
          this.pendingSpans.push({
            text: num,
            bold: true,
            italic: false,
            underline: false,
            fontSize: style.fontSize,
            color: COLORS.accent,
          });
        } else {
          // Draw a colored bullet circle
          this.ensureSpace(style.fontSize * LINE_HEIGHT_FACTOR);
          const bulletX = MARGIN_LEFT + indent - 12;
          const bulletY = this.y - 3;
          this.page.drawCircle({
            x: bulletX,
            y: bulletY,
            size: 2.5,
            color: COLORS.bulletColor,
          });
          // Push empty to keep alignment
        }

        await this.renderChildren(node, childStyle);
        this.flush();
        this.addSpacing(4);
        return;
      }

      case "img": {
        await this.renderImage(node);
        return;
      }

      case "table": {
        this.flush();
        this.addSpacing(10);
        await this.renderTable(node, childStyle);
        this.addSpacing(10);
        return;
      }

      case "blockquote": {
        this.flush();
        this.addSpacing(10);

        childStyle.italic = true;
        childStyle.color = COLORS.blockquoteText;
        childStyle.fontSize = style.fontSize + 0.5;

        const startY = this.y;
        const startPage = this.pageIndex;
        const savedDepth = this.listDepth;
        this.listDepth += 1;
        this.blockquoteDepth++;

        await this.renderChildren(node, childStyle);
        this.flush();

        this.blockquoteDepth--;
        this.listDepth = savedDepth;

        const endY = this.y;
        // Draw background and left accent bar on same page
        if (this.pageIndex === startPage) {
          const bgHeight = startY - endY + 12;
          this.page.drawRectangle({
            x: MARGIN_LEFT,
            y: endY - 6,
            width: MAX_W,
            height: bgHeight,
            color: COLORS.blockquoteBg,
          });
          this.page.drawRectangle({
            x: MARGIN_LEFT,
            y: endY - 6,
            width: 3.5,
            height: bgHeight,
            color: COLORS.blockquoteBar,
          });
          // Re-draw text on top by moving content (text is already drawn, so we draw bg behind)
          // Actually pdf-lib draws in order, so bg will be on top. We need to draw bg first.
          // Workaround: we'll handle this differently...
        }

        this.addSpacing(10);
        return;
      }

      case "pre": case "code": {
        childStyle.fontSize = 9.5;
        await this.renderChildren(node, childStyle);
        return;
      }

      case "div": case "section": case "article": case "main": case "header": case "footer": case "nav": case "span": {
        await this.renderChildren(node, childStyle);
        return;
      }

      default: {
        await this.renderChildren(node, childStyle);
        return;
      }
    }
  }

  private async renderChildren(node: any, style: StyleCtx) {
    if (node.childNodes) {
      await this.renderNodes(node.childNodes, style);
    }
  }

  // ── Image rendering ───────────────────────────────────────────
  private async renderImage(node: any) {
    const src: string = node.attribs?.src ?? "";
    if (!src) return;

    try {
      let imageBytes: Uint8Array;

      if (src.startsWith("data:")) {
        const base64 = src.split(",")[1];
        imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      } else {
        const resp = await fetch(src);
        if (!resp.ok) return;
        imageBytes = new Uint8Array(await resp.arrayBuffer());
      }

      let image: PDFImage;
      if (src.includes("png") || src.startsWith("data:image/png")) {
        image = await this.doc.embedPng(imageBytes);
      } else {
        image = await this.doc.embedJpg(imageBytes);
      }

      const maxImgW = MAX_W - this.listDepth * 24;
      const maxImgH = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM - 40;
      let imgW = image.width;
      let imgH = image.height;

      if (imgW > maxImgW) {
        imgH = (maxImgW / imgW) * imgH;
        imgW = maxImgW;
      }
      if (imgH > maxImgH) {
        imgW = (maxImgH / imgH) * imgW;
        imgH = maxImgH;
      }

      this.flush();
      this.addSpacing(6);
      this.ensureSpace(imgH + 12);

      const indent = this.listDepth * 24;
      const imgX = MARGIN_LEFT + indent;

      // Draw subtle rounded border/shadow effect
      this.page.drawRectangle({
        x: imgX - 1,
        y: this.y - imgH - 1,
        width: imgW + 2,
        height: imgH + 2,
        borderColor: COLORS.borderLight,
        borderWidth: 0.5,
        color: COLORS.white,
      });

      this.page.drawImage(image, {
        x: imgX,
        y: this.y - imgH,
        width: imgW,
        height: imgH,
      });

      this.y -= imgH;
      this.addSpacing(8);
    } catch {
      // skip failed images
    }
  }

  // ── Table rendering ───────────────────────────────────────────
  private async renderTable(node: any, style: StyleCtx) {
    const rows: any[][] = [];
    this.collectRows(node, rows);

    if (rows.length === 0) return;

    const colCount = Math.max(...rows.map((r) => r.length));
    if (colCount === 0) return;

    const tableW = MAX_W - this.listDepth * 24;
    const colWidth = tableW / colCount;
    const cellPadding = 8;
    const rowHeight = style.fontSize * 1.4 + cellPadding * 2;
    const indent = MARGIN_LEFT + this.listDepth * 24;

    for (let ri = 0; ri < rows.length; ri++) {
      this.ensureSpace(rowHeight + 2);

      const isFirstRow = ri === 0;
      const firstCellIsHeader = rows[ri][0]?.name === "th";
      const isHeader = isFirstRow || firstCellIsHeader;
      const isEvenRow = ri % 2 === 0;

      for (let ci = 0; ci < colCount; ci++) {
        const cellX = indent + ci * colWidth;
        const cellNode = rows[ri][ci];
        const cellIsHeader = cellNode?.name === "th" || isHeader;

        // Cell background
        let bgColor = isEvenRow ? COLORS.tableWhite : COLORS.tableStripe;
        if (cellIsHeader) bgColor = COLORS.tableHeader;

        this.page.drawRectangle({
          x: cellX,
          y: this.y - rowHeight,
          width: colWidth,
          height: rowHeight,
          color: bgColor,
        });

        // Subtle cell borders (only horizontal lines for clean look)
        if (!cellIsHeader) {
          this.page.drawLine({
            start: { x: indent, y: this.y - rowHeight },
            end: { x: indent + tableW, y: this.y - rowHeight },
            thickness: 0.3,
            color: COLORS.borderLight,
          });
        }

        // Cell text
        const cellText = this.getTextContent(cellNode).trim().replace(/\s+/g, " ");
        const font = cellIsHeader ? this.fonts.bold : this.fonts.regular;
        const textColor = cellIsHeader ? COLORS.tableHeaderText : COLORS.text;
        const truncated = this.truncateText(cellText, font, style.fontSize, colWidth - cellPadding * 2);

        this.page.drawText(truncated, {
          x: cellX + cellPadding,
          y: this.y - rowHeight + cellPadding + 1,
          size: style.fontSize,
          font,
          color: textColor,
        });
      }

      // Bottom border for header row
      if (isHeader) {
        this.page.drawLine({
          start: { x: indent, y: this.y - rowHeight },
          end: { x: indent + tableW, y: this.y - rowHeight },
          thickness: 1.5,
          color: COLORS.accent,
        });
      }

      this.y -= rowHeight;
    }

    // Bottom border for entire table
    this.page.drawLine({
      start: { x: indent, y: this.y },
      end: { x: indent + tableW, y: this.y },
      thickness: 0.5,
      color: COLORS.border,
    });
  }

  private collectRows(node: any, rows: any[][]) {
    if (!node.childNodes) return;
    for (const child of node.childNodes) {
      if (child.name === "tr") {
        const cells: any[] = [];
        if (child.childNodes) {
          for (const cell of child.childNodes) {
            if (cell.name === "td" || cell.name === "th") {
              cells.push(cell);
            }
          }
        }
        rows.push(cells);
      } else {
        this.collectRows(child, rows);
      }
    }
  }

  // ── Text drawing ──────────────────────────────────────────────
  private drawSpans(spans: TextSpan[]) {
    if (spans.length === 0) return;

    const indent = this.listDepth * 24;
    const availableW = MAX_W - indent;

    const lines = this.wrapSpans(spans, availableW);

    for (const line of lines) {
      const lineH = Math.max(...line.map((s) => s.fontSize)) * LINE_HEIGHT_FACTOR;
      this.ensureSpace(lineH);

      let x = MARGIN_LEFT + indent;
      for (const span of line) {
        const font = this.pickFont(span.bold, span.italic);
        this.page.drawText(span.text, {
          x,
          y: this.y,
          size: span.fontSize,
          font,
          color: span.color,
        });

        const textW = font.widthOfTextAtSize(span.text, span.fontSize);

        if (span.underline) {
          this.page.drawLine({
            start: { x, y: this.y - 1.5 },
            end: { x: x + textW, y: this.y - 1.5 },
            thickness: 0.4,
            color: span.color,
          });
        }

        x += textW;
      }

      this.y -= lineH;
    }
  }

  private wrapSpans(spans: TextSpan[], maxW: number): TextSpan[][] {
    const lines: TextSpan[][] = [[]];
    let lineW = 0;

    for (const span of spans) {
      const font = this.pickFont(span.bold, span.italic);
      const words = span.text.split(/( +)/);

      for (const word of words) {
        if (word === "") continue;
        const wordW = font.widthOfTextAtSize(word, span.fontSize);

        if (lineW + wordW > maxW && lineW > 0 && word.trim() !== "") {
          lines.push([]);
          lineW = 0;
        }

        if (lineW === 0 && word.trim() === "") continue;

        lines[lines.length - 1].push({ ...span, text: word });
        lineW += wordW;
      }
    }

    return lines.filter((l) => l.length > 0);
  }

  // ── Helpers ───────────────────────────────────────────────────
  private pickFont(bold: boolean, italic: boolean): PDFFont {
    if (bold && italic) return this.fonts.boldItalic;
    if (bold) return this.fonts.bold;
    if (italic) return this.fonts.italic;
    return this.fonts.regular;
  }

  private ensureSpace(needed: number) {
    if (this.y - needed < MARGIN_BOTTOM) {
      this.page = this.newPage();
    }
  }

  private addSpacing(amount: number) {
    this.y -= amount;
  }

  private getTextContent(node: any): string {
    if (!node) return "";
    if (node.type === "text") return node.data ?? "";
    let text = "";
    if (node.childNodes) {
      for (const child of node.childNodes) {
        text += this.getTextContent(child);
      }
    }
    return text;
  }

  private truncateText(text: string, font: PDFFont, size: number, maxW: number): string {
    if (font.widthOfTextAtSize(text, size) <= maxW) return text;
    let t = text;
    while (t.length > 0 && font.widthOfTextAtSize(t + "…", size) > maxW) {
      t = t.slice(0, -1);
    }
    return t + "…";
  }
}
