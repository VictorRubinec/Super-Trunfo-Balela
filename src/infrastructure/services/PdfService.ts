import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { ICard } from '@/core/domain/Card';
import { PageFormat, PrintSettings } from '@/core/domain/Export';

const MM_TO_PT = 72 / 25.4;
const CARD_W_MM = 63;
const CARD_H_MM = 88;

const PAGE_DIMENSIONS: Record<PageFormat, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  'super-a4': { w: 225, h: 320 },
  a3: { w: 297, h: 420 },
  'super-a3': { w: 320, h: 450 },
};

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const int = parseInt(value, 16);
  if (Number.isNaN(int)) return rgb(0.486, 0.227, 0.929);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return rgb(r, g, b);
}

export class PdfService {
  private calculateGrid(settings: PrintSettings) {
    const fmt = PAGE_DIMENSIONS[settings.format];
    const bleed = settings.useBleed ? settings.bleed : 0;
    const margin = settings.margin;
    const gap = settings.cutmarks ? 6 : 0;

    const availW = fmt.w - margin * 2;
    const availH = fmt.h - margin * 2;
    const cellW = CARD_W_MM + bleed * 2;
    const cellH = CARD_H_MM + bleed * 2;

    const cols = Math.floor((availW + gap) / (cellW + gap));
    const rows = Math.floor((availH + gap) / (cellH + gap));

    if (cols <= 0 || rows <= 0) {
      throw new Error('Configuração inválida: nenhuma carta cabe na página com esta margem/sangria.');
    }

    const gridW = cols * cellW + (cols - 1) * gap;
    const gridH = rows * cellH + (rows - 1) * gap;
    const offsetX = margin + (availW - gridW) / 2;
    const offsetY = margin + (availH - gridH) / 2;

    return { cols, rows, cellW, cellH, gap, offsetX, offsetY, fmt };
  }

  async generatePrintPdf(cards: ICard[], settings: PrintSettings, type: 'front' | 'back'): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const grid = this.calculateGrid(settings);

    const cardsPerPage = grid.cols * grid.rows;

    for (let i = 0; i < cards.length; i += cardsPerPage) {
      const pageCards = cards.slice(i, i + cardsPerPage);
      const page = pdf.addPage([grid.fmt.w * MM_TO_PT, grid.fmt.h * MM_TO_PT]);

      for (let j = 0; j < pageCards.length; j++) {
        const card = pageCards[j];
        const row = Math.floor(j / grid.cols);
        let col = j % grid.cols;
        if (type === 'back') col = (grid.cols - 1) - col;

        const xMm = grid.offsetX + col * (grid.cellW + grid.gap);
        const yMm = grid.fmt.h - (grid.offsetY + row * (grid.cellH + grid.gap) + grid.cellH);

        this.drawCard(page, card, xMm * MM_TO_PT, yMm * MM_TO_PT, grid.cellW * MM_TO_PT, grid.cellH * MM_TO_PT, type, font, fontRegular, settings);
      }
    }

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  private drawCard(
    page: PDFPage,
    card: ICard,
    x: number,
    y: number,
    w: number,
    h: number,
    type: 'front' | 'back',
    font: PDFFont,
    fontRegular: PDFFont,
    settings: PrintSettings
  ) {
    const bleedPt = (settings.useBleed ? settings.bleed : 0) * MM_TO_PT;
    const innerX = x + bleedPt;
    const innerY = y + bleedPt;
    const innerW = w - bleedPt * 2;
    const innerH = h - bleedPt * 2;

    if (type === 'back') {
      page.drawRectangle({ x, y, width: w, height: h, color: rgb(0.059, 0.016, 0.149) });
      page.drawRectangle({ x: innerX + 8, y: innerY + 8, width: innerW - 16, height: innerH - 16, borderColor: rgb(0.486, 0.227, 0.929), borderWidth: 2 });
      page.drawText('BALELA TRUNFO', { x: innerX + 14, y: innerY + innerH / 2, size: 14, font, color: rgb(1, 1, 1) });
      return;
    }

    const color = hexToRgb(card.cor || '#7c3aed');
    page.drawRectangle({ x, y, width: w, height: h, color });
    page.drawRectangle({ x: innerX, y: innerY, width: innerW, height: innerH, color: rgb(0.96, 0.96, 0.98) });

    const title = (card.titulo || 'Sem titulo').slice(0, 28);
    const typeLabel = (card.tipo || 'Sem tipo').slice(0, 20);
    const phrase = (card.frase || '').slice(0, 48);
    const model = (card.modelo || 'v1').toUpperCase();

    page.drawText(title, { x: innerX + 8, y: innerY + innerH - 20, size: 9, font, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(typeLabel, { x: innerX + 8, y: innerY + innerH - 34, size: 7, font: fontRegular, color: rgb(0.25, 0.32, 0.43) });
    page.drawText(`MODELO ${model}`, { x: innerX + innerW - 56, y: innerY + innerH - 20, size: 6, font: fontRegular, color: rgb(0.25, 0.32, 0.43) });

    const lines = [
      `ENT ${card.atributos?.entretenimento ?? 0}`,
      `VER ${card.atributos?.vergonha_alheia ?? 0}`,
      `COM ${card.atributos?.competencia ?? 0}`,
      `BAL ${card.atributos?.balela ?? 0}`,
      `CLI ${card.atributos?.climao ?? 0}`,
    ];

    for (let i = 0; i < lines.length; i++) {
      page.drawText(lines[i], { x: innerX + 8, y: innerY + 54 - i * 10, size: 7, font: fontRegular, color: rgb(0.1, 0.14, 0.2) });
    }

    if (phrase) {
      page.drawText(`"${phrase}"`, { x: innerX + 8, y: innerY + 10, size: 6, font: fontRegular, color: rgb(0.34, 0.38, 0.46) });
    }

    if (settings.cutmarks && bleedPt > 0) {
      const L = 3 * MM_TO_PT;
      const c = rgb(0, 0, 0);
      const t = 0.5;
      page.drawLine({ start: { x: innerX, y: y + h }, end: { x: innerX, y: y + h + L }, thickness: t, color: c });
      page.drawLine({ start: { x: x, y: innerY }, end: { x: x - L, y: innerY }, thickness: t, color: c });
      page.drawLine({ start: { x: innerX + innerW, y: y + h }, end: { x: innerX + innerW, y: y + h + L }, thickness: t, color: c });
      page.drawLine({ start: { x: x + w, y: innerY }, end: { x: x + w + L, y: innerY }, thickness: t, color: c });
      page.drawLine({ start: { x: innerX, y }, end: { x: innerX, y: y - L }, thickness: t, color: c });
      page.drawLine({ start: { x: x, y: innerY + innerH }, end: { x: x - L, y: innerY + innerH }, thickness: t, color: c });
      page.drawLine({ start: { x: innerX + innerW, y }, end: { x: innerX + innerW, y: y - L }, thickness: t, color: c });
      page.drawLine({ start: { x: x + w, y: innerY + innerH }, end: { x: x + w + L, y: innerY + innerH }, thickness: t, color: c });
    }
  }
}
