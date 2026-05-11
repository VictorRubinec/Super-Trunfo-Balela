import { PDFDocument, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { domToJpeg } from 'modern-screenshot';
import { ICard } from '@/core/domain/Card';
import { PrintSettings } from '@/core/domain/Export';

const MM_TO_PT = 72 / 25.4; // 1mm = 2.83465 points (padrão PDF)
const CARD_W_MM = 63;
const CARD_H_MM = 88;

const PAGE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  'a4': { w: 210, h: 297 },
  'super-a4': { w: 225, h: 320 },
  'a3': { w: 297, h: 420 },
  'super-a3': { w: 320, h: 450 }
};

export class FrontendExportService {
  /**
   * Captura as cartas renderizadas no DOM e monta os PDFs (Frentes e Versos).
   */
  static async exportToZip(
    cards: ICard[],
    settings: PrintSettings,
    containerRef: HTMLElement,
    onProgress: (msg: string, percent: number) => void
  ): Promise<void> {
    
    // 1. Preparar Layout e Constantes
    const fmt = PAGE_DIMENSIONS[settings.format] || PAGE_DIMENSIONS['a4'];
    const bleed = settings.useBleed ? settings.bleed : 0;
    
    const cellW = CARD_W_MM + bleed * 2;
    const cellH = CARD_H_MM + bleed * 2;

    // Espaçamento entre as cartas na grade (Gutter)
    // Se tiver marcas de corte, precisa de pelo menos 6mm de gap para as linhas não se tocarem (3mm de cada lado)
    const gap = settings.cutmarks ? 6 : 0;

    const availW = fmt.w - settings.margin * 2;
    const availH = fmt.h - settings.margin * 2;

    const cols = Math.floor((availW + gap) / (cellW + gap));
    const rows = Math.floor((availH + gap) / (cellH + gap));
    const cardsPerPage = cols * rows;

    if (cardsPerPage <= 0) {
      throw new Error('A margem é muito grande para caber até mesmo uma carta neste formato de página.');
    }

    // Calcular offset (padding interno para centralizar o grid na área útil)
    const gridW = cols * cellW + (cols - 1) * gap;
    const gridH = rows * cellH + (rows - 1) * gap;
    const offsetX = settings.margin + (availW - gridW) / 2;
    const offsetY = settings.margin + (availH - gridH) / 2; // Atenção: no PDF-lib o (0,0) é no canto inferior esquerdo

    const totalCards = cards.length;
    onProgress('Preparando para fotografar...', 5);

    // 2. Tirar "Foto" de cada carta no DOM
    const frontImages: string[] = [];
    const domCards = Array.from(containerRef.querySelectorAll('.export-card-node')) as HTMLElement[];
    
    for (let i = 0; i < domCards.length; i++) {
      const node = domCards[i];
      // modern-screenshot é rápido, mas vamos dar uma pequena pausa a cada 10 cartas para não travar a UI
      if (i > 0 && i % 10 === 0) {
        await new Promise(r => setTimeout(r, 50));
      }
      onProgress(`Fotografando carta ${i + 1} de ${totalCards}...`, 5 + Math.floor((i / totalCards) * 45));
      
      const dataUrl = await domToJpeg(node, {
        scale: 3, // 3x equivale a aproximadamente 300 DPI (se a base for 96 DPI)
        quality: 0.95,
        backgroundColor: settings.useBleed ? node.dataset.color || '#ffffff' : 'transparent',
      });
      frontImages.push(dataUrl);
    }

    // 3. Montar o PDF das Frentes
    onProgress('Montando PDF (Frentes)...', 55);
    const frontPdfDoc = await PDFDocument.create();
    await this.drawGridToPdf(frontPdfDoc, frontImages, cols, rows, fmt.w, fmt.h, offsetX, offsetY, cellW, cellH, bleed, settings.cutmarks, false, gap);
    
    // 4. Tirar "Foto" do Verso (O verso é genérico, só precisamos de 1 imagem base)
    onProgress('Fotografando o Verso...', 75);
    const backNode = containerRef.querySelector('.export-back-node') as HTMLElement;
    const backDataUrl = await domToJpeg(backNode, { scale: 3, quality: 0.95, backgroundColor: '#0f0426' });
    
    // Multiplicar o verso pela quantidade de cartas para desenhar no grid
    const backImages = Array(totalCards).fill(backDataUrl);

    // 5. Montar o PDF dos Versos (Com Espelhamento)
    onProgress('Montando PDF (Versos)...', 80);
    const backPdfDoc = await PDFDocument.create();
    await this.drawGridToPdf(backPdfDoc, backImages, cols, rows, fmt.w, fmt.h, offsetX, offsetY, cellW, cellH, bleed, settings.cutmarks, true, gap);

    // 6. Gerar e baixar o ZIP
    onProgress('Compactando arquivos...', 95);
    const frontBytes = await frontPdfDoc.save();
    const backBytes = await backPdfDoc.save();

    const zip = new JSZip();
    zip.file('frentes.pdf', frontBytes);
    zip.file('versos.pdf', backBytes);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    onProgress('Concluído!', 100);
    
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.projectName || 'Balela_Trunfo'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Desenha as imagens em um documento PDF, arranjando em páginas A4 e colunas.
   */
  private static async drawGridToPdf(
    pdfDoc: PDFDocument,
    imagesData: string[],
    cols: number,
    rows: number,
    pageW_mm: number,
    pageH_mm: number,
    offsetX_mm: number,
    offsetY_mm: number,
    cellW_mm: number,
    cellH_mm: number,
    bleed_mm: number,
    drawCutmarks: boolean,
    isMirrored: boolean,
    gap_mm: number
  ) {
    const cardsPerPage = cols * rows;
    
    // Carregar todas as imagens no documento PDF uma única vez (otimização)
    // Para as frentes, teremos várias únicas. Para versos, é a mesma (mas enviamos um array cheio).
    // Para economizar memória, vamos fazer um cache de imagens já embutidas pelo dataUrl.
    const embeddedImagesCache = new Map();

    const getEmbeddedImage = async (dataUrl: string) => {
      if (embeddedImagesCache.has(dataUrl)) return embeddedImagesCache.get(dataUrl);
      const img = await pdfDoc.embedJpg(dataUrl);
      embeddedImagesCache.set(dataUrl, img);
      return img;
    };

    const drawCropMarks = (page: any, x: number, y: number, w: number, h: number, b: number) => {
      const L = 3 * MM_TO_PT; // Comprimento da linha da marca
      const c = rgb(0, 0, 0);
      const t = 0.5;

      // Top Left
      page.drawLine({ start: { x: x + b, y: y + h }, end: { x: x + b, y: y + h + L }, thickness: t, color: c });
      page.drawLine({ start: { x: x, y: y + h - b }, end: { x: x - L, y: y + h - b }, thickness: t, color: c });
      
      // Top Right
      page.drawLine({ start: { x: x + w - b, y: y + h }, end: { x: x + w - b, y: y + h + L }, thickness: t, color: c });
      page.drawLine({ start: { x: x + w, y: y + h - b }, end: { x: x + w + L, y: y + h - b }, thickness: t, color: c });

      // Bottom Left
      page.drawLine({ start: { x: x + b, y: y }, end: { x: x + b, y: y - L }, thickness: t, color: c });
      page.drawLine({ start: { x: x, y: y + b }, end: { x: x - L, y: y + b }, thickness: t, color: c });

      // Bottom Right
      page.drawLine({ start: { x: x + w - b, y: y }, end: { x: x + w - b, y: y - L }, thickness: t, color: c });
      page.drawLine({ start: { x: x + w, y: y + b }, end: { x: x + w + L, y: y + b }, thickness: t, color: c });
    };

    for (let i = 0; i < imagesData.length; i += cardsPerPage) {
      const pageCards = imagesData.slice(i, i + cardsPerPage);
      const page = pdfDoc.addPage([pageW_mm * MM_TO_PT, pageH_mm * MM_TO_PT]);

      for (let j = 0; j < pageCards.length; j++) {
        const row = Math.floor(j / cols);
        let col = j % cols;

        // Se for verso, espelhar a coluna para bater perfeitamente ao imprimir frente/verso
        if (isMirrored) {
          col = (cols - 1) - col;
        }

        const dataUrl = pageCards[j];
        if (!dataUrl) continue;

        const img = await getEmbeddedImage(dataUrl);

        // pdf-lib usa (0,0) no canto INFERIOR esquerdo.
        // Nossa matemática (row=0) começa no TOPO da página.
        const x_mm = offsetX_mm + (col * (cellW_mm + gap_mm));
        const y_mm = pageH_mm - (offsetY_mm + (row * (cellH_mm + gap_mm)) + cellH_mm);

        const x_pt = x_mm * MM_TO_PT;
        const y_pt = y_mm * MM_TO_PT;
        const w_pt = cellW_mm * MM_TO_PT;
        const h_pt = cellH_mm * MM_TO_PT;

        page.drawImage(img, {
          x: x_pt,
          y: y_pt,
          width: w_pt,
          height: h_pt,
        });

        if (drawCutmarks) {
          drawCropMarks(page, x_pt, y_pt, w_pt, h_pt, bleed_mm * MM_TO_PT);
        }
      }
    }
  }
}
