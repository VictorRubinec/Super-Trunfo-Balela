const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const puppeteer = isVercel ? require('puppeteer-core') : require('puppeteer');
const chromium  = isVercel ? require('@sparticuz/chromium') : null;
const fs   = require('fs');
const path = require('path');
const { cardToHtml, colorVars } = require('./card-renderer');

const CSS_DIR = path.join(__dirname, '../../public/css');

const PAGE_FORMATS = {
    'a4':       { width: 210, height: 297, label: 'A4' },
    'super-a4': { width: 225, height: 320, label: 'Super A4' },
    'a3':       { width: 297, height: 420, label: 'A3' },
    'super-a3': { width: 320, height: 450, label: 'Super A3' },
};

async function getLaunchOptions() {
    if (isVercel) {
        return {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        };
    }
    return {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
}

const CARD_W = 63;      // mm
const CARD_H = 88;      // mm
const PAGE_MARGIN = 10; // mm (margem obrigatória da folha)

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Calcula o melhor arranjo (cols x rows) testando a orientação da CARTA e considerando o GAP */
function calculateBestGrid(pageW, pageH, cardW, cardH, bleed, gap = 0) {
    const availW = pageW - PAGE_MARGIN * 2;
    const availH = pageH - PAGE_MARGIN * 2;

    // Opção 1: Cartas em Retrato
    const cellW1 = cardW + bleed * 2;
    const cellH1 = cardH + bleed * 2;
    const cols1  = Math.floor((availW + gap) / (cellW1 + gap));
    const rows1  = Math.floor((availH + gap) / (cellH1 + gap));
    const total1 = cols1 * rows1;

    // Opção 2: Cartas em Paisagem
    const cellW2 = cardH + bleed * 2;
    const cellH2 = cardW + bleed * 2;
    const cols2  = Math.floor((availW + gap) / (cellW2 + gap));
    const rows2  = Math.floor((availH + gap) / (cellH2 + gap));
    const total2 = cols2 * rows2;

    if (total2 > total1) {
        return { cols: cols2, rows: rows2, rotateCard: true, cW: cellW2, cH: cellH2 };
    }
    return { cols: cols1, rows: rows1, rotateCard: false, cW: cellW1, cH: cellH1 };
}

/* cardToHtml extemalized to card-renderer.js */
function cutmarkSVG(bleed, cardW, cardH, rotated = false) {
    // Se a carta está rotacionada, as marcas devem bater com o novo "bound box"
    // Mas é mais simples rotacionar o conteúdo todo do container.
    // Vamos manter as marcas originais e o transform rotate(90) cuidará de tudo.
    const cW = cardW + bleed * 2;
    const cH = cardH + bleed * 2;
    const B  = bleed;
    const M  = 5;

    const lines = [
        // top-left
        `<line x1="${B-M}" y1="${B}" x2="${B}" y2="${B}" stroke="#000" stroke-width=".25"/>`,
        `<line x1="${B}" y1="${B-M}" x2="${B}" y2="${B}" stroke="#000" stroke-width=".25"/>`,
        // top-right
        `<line x1="${B+cardW}" y1="${B}" x2="${B+cardW+M}" y2="${B}" stroke="#000" stroke-width=".25"/>`,
        `<line x1="${B+cardW}" y1="${B-M}" x2="${B+cardW}" y2="${B}" stroke="#000" stroke-width=".25"/>`,
        // bottom-left
        `<line x1="${B-M}" y1="${B+cardH}" x2="${B}" y2="${B+cardH}" stroke="#000" stroke-width=".25"/>`,
        `<line x1="${B}" y1="${B+cardH}" x2="${B}" y2="${B+cardH+M}" stroke="#000" stroke-width=".25"/>`,
        // bottom-right
        `<line x1="${B+cardW}" y1="${B+cardH}" x2="${B+cardW+M}" y2="${B+cardH}" stroke="#000" stroke-width=".25"/>`,
        `<line x1="${B+cardW}" y1="${B+cardH}" x2="${B+cardW}" y2="${B+cardH+M}" stroke="#000" stroke-width=".25"/>`,
    ].join('');

    return `<svg xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 ${cW} ${cH}"
                 style="position:absolute;inset:0;width:${cW}mm;height:${cH}mm;overflow:visible;pointer-events:none;z-index:10;">
                ${lines}
            </svg>`;
}

function buildPrintHTML(cards, format, showCutmarks, bleedValue, port) {
    const fmt   = PAGE_FORMATS[format] || PAGE_FORMATS['a4'];
    const BLEED = showCutmarks ? bleedValue : 0;
    const GAP   = 0;

    // Cálculo dinâmico da melhor grade (testando orientação da CARTA)
    const gridInfo = calculateBestGrid(fmt.width, fmt.height, CARD_W, CARD_H, BLEED, GAP);
    const { cols, rows, rotateCard, cW: cellW, cH: cellH } = gridInfo;

    const perPage = cols * rows;

    // Centralizar o grid na área útil
    const gridW = cols * cellW + Math.max(0, cols - 1) * GAP;
    const gridH = rows * cellH + Math.max(0, rows - 1) * GAP;
    const padX  = ((fmt.width  - gridW) / 2).toFixed(2);
    const padY  = ((fmt.height - gridH) / 2).toFixed(2);

    // Dividir em páginas
    const pages = [];
    for (let i = 0; i < Math.max(1, cards.length); i += perPage) {
        pages.push(cards.slice(i, i + perPage));
    }

    // CSS da carta lidos do disco
    const cssV1 = fs.readFileSync(path.join(CSS_DIR, 'models/v1-default.css'), 'utf-8');
    const cssV2 = fs.readFileSync(path.join(CSS_DIR, 'models/v2-especial.css'), 'utf-8');
    const cssV3 = fs.readFileSync(path.join(CSS_DIR, 'models/v3-full-art.css'), 'utf-8');
    const cssV4 = fs.readFileSync(path.join(CSS_DIR, 'models/v4-thumb.css'), 'utf-8');
    const cssV5 = fs.readFileSync(path.join(CSS_DIR, 'models/v5-full-thumb.css'), 'utf-8');
    const cssV6 = fs.readFileSync(path.join(CSS_DIR, 'models/v6-showcase.css'), 'utf-8');

    const pagesHTML = pages.map((pageCards, pi) => {
        const cells = Array.from({ length: perPage }, (_, i) => {
            const card = pageCards[i];
            if (!card) {
                return `<div style="width:${cellW}mm;height:${cellH}mm;"></div>`;
            }

            const cardTheme = colorVars(card.cor || '#7B2FBE');
            let bleedColor = 'var(--c-base)';
            if (card.modelo === 'v3-full-art') bleedColor = 'var(--c-dark)';
            if (card.modelo === 'v2-especial') bleedColor = 'var(--c-darker)';

            const marks = showCutmarks ? cutmarkSVG(BLEED, CARD_W, CARD_H) : '';
            
            // Se a carta deve ser rotacionada para caber mais
            const rotateCSS = rotateCard ? 'transform: rotate(90deg);' : '';

            return `
                <div style="width:${cellW}mm;height:${cellH}mm;position:relative;
                            display:flex;align-items:center;justify-content:center;
                            background:${bleedColor}; ${cardTheme}">
                    <div style="width:${CARD_W + BLEED*2}mm;height:${CARD_H + BLEED*2}mm;
                                display:flex;align-items:center;justify-content:center;
                                position:relative;${rotateCSS}">
                        ${marks}
                        ${cardToHtml(card, port)}
                    </div>
                </div>`;
        }).join('');

        const breakAfter = pi < pages.length - 1 ? 'page-break-after:always;' : '';
        return `
            <div style="width:${fmt.width}mm;height:${fmt.height}mm;${breakAfter}
                        display:flex;align-items:flex-start;justify-content:flex-start;">
                <div style="display:grid;
                            grid-template-columns:repeat(${cols},${cellW}mm);
                            grid-template-rows:repeat(${rows},${cellH}mm);
                            gap:${GAP}mm;
                            padding:${padY}mm ${padX}mm;
                            width:${fmt.width}mm;
                            box-sizing:border-box;">
                    ${cells}
                </div>
            </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;font-family:'Outfit',sans-serif;}
${cssV1}
${cssV2}
${cssV3}
${cssV4}
${cssV5}
${cssV6}
.card{
    width:${CARD_W}mm!important;
    height:${CARD_H}mm!important;
    aspect-ratio:unset!important;
    border-radius:3mm!important;
    box-shadow: none !important;
}
.placeholder-icon{width:12mm!important;height:12mm!important;}
.card-title-text{font-size:3.5mm!important;}
.card-phrase-text{font-size:2.8mm!important;}
.card-attributes .attr-label{font-size:2.1mm!important;}
.card-attributes .attr-value{font-size:2.8mm!important;}
.card-pacote{font-size:1.8mm!important;}
.card-tipo-badge{font-size:2mm!important;}
.attr-label-short{font-size:2mm!important;}

</style>
</head>
<body>${pagesHTML}</body>
</html>`;
}
async function generatePDF(cards, format, showCutmarks, bleed, port = 3000) {
    const fmt  = PAGE_FORMATS[format] || PAGE_FORMATS['a4'];
    const html = buildPrintHTML(cards, format, showCutmarks, bleed, port);

    const options = await getLaunchOptions();
    const browser = await puppeteer.launch(options);

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pdfRaw = await page.pdf({
            width:           `${fmt.width}mm`,
            height:          `${fmt.height}mm`,
            printBackground: true,
            margin:          { top: '0', right: '0', bottom: '0', left: '0' },
        });

        return Buffer.isBuffer(pdfRaw) ? pdfRaw : Buffer.from(pdfRaw);
    } finally {
        await browser.close();
    }
}

function buildBacksHTML(cards, format, showCutmarks, bleedValue, port) {
    const fmt   = PAGE_FORMATS[format] || PAGE_FORMATS['a4'];
    const BLEED = showCutmarks ? bleedValue : 0;
    const GAP   = 0;

    const gridInfo = calculateBestGrid(fmt.width, fmt.height, CARD_W, CARD_H, BLEED, GAP);
    const { cols, rows, rotateCard, cW: cellW, cH: cellH } = gridInfo;
    const perPage = cols * rows;

    const gridW = cols * cellW + Math.max(0, cols - 1) * GAP;
    const gridH = rows * cellH + Math.max(0, rows - 1) * GAP;
    const padX  = ((fmt.width  - gridW) / 2).toFixed(2);
    const padY  = ((fmt.height - gridH) / 2).toFixed(2);

    const pages = [];
    for (let i = 0; i < Math.max(1, cards.length); i += perPage) {
        pages.push(cards.slice(i, i + perPage));
    }

    const cssBack = fs.readFileSync(path.join(CSS_DIR, 'card-back.css'), 'utf-8');

    const pagesHTML = pages.map((pageCards, pi) => {
        const cells = Array.from({ length: perPage }, (_, i) => {
            // Lógica de espelhamento horizontal para alinhar com a frente no verso da folha
            const row = Math.floor(i / cols);
            const col = i % cols;
            const mirroredCol = (cols - 1) - col;
            const mirroredI = row * cols + mirroredCol;
            
            const card = pageCards[mirroredI];
            // Se não houver carta nessa posição espelhada, deixa célula vazia (preserva alinhamento)
            if (!card && mirroredI < perPage) {
                return `<div style="width:${cellW}mm;height:${cellH}mm;"></div>`;
            }

            const marks = showCutmarks ? cutmarkSVG(BLEED, CARD_W, CARD_H) : '';
            const rotateCSS = rotateCard ? 'transform: rotate(90deg);' : '';

            const logoUrl = `http://localhost:${port}/assets/logo/logo-4.png`;

            return `
                <div style="width:${cellW}mm;height:${cellH}mm;position:relative;
                            display:flex;align-items:center;justify-content:center;
                            background:#0f0426;">
                    <div style="width:${CARD_W + BLEED*2}mm;height:${CARD_H + BLEED*2}mm;
                                display:flex;align-items:center;justify-content:center;
                                position:relative;${rotateCSS}">
                        ${marks}
                        <div class="card-back print-card">
                            <div class="back-content">
                                <img src="${logoUrl}" class="back-logo-main" />
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');

        const breakAfter = pi < pages.length - 1 ? 'page-break-after:always;' : '';
        return `
            <div style="width:${fmt.width}mm;height:${fmt.height}mm;${breakAfter}
                        display:flex;align-items:flex-start;justify-content:flex-start;">
                <div style="display:grid;
                            grid-template-columns:repeat(${cols},${cellW}mm);
                            grid-template-rows:repeat(${rows},${cellH}mm);
                            gap:${GAP}mm;
                            padding:${padY}mm ${padX}mm;
                            width:${fmt.width}mm;
                            box-sizing:border-box;">
                    ${cells}
                </div>
            </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
body{background:#fff;}
${cssBack}
.card-back {
    width:${CARD_W}mm!important;
    height:${CARD_H}mm!important;
    border-radius:3mm!important;
    box-shadow:none!important;
}
.back-logo-main { width: 60mm!important; }
</style>
</head>
<body>${pagesHTML}</body>
</html>`;
}

async function generateBacksPDF(cards, format, showCutmarks, bleed, port = 3000) {
    const fmt  = PAGE_FORMATS[format] || PAGE_FORMATS['a4'];
    const html = buildBacksHTML(cards, format, showCutmarks, bleed, port);

    const options = await getLaunchOptions();
    const browser = await puppeteer.launch(options);

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 1500));

        const pdfRaw = await page.pdf({
            width: `${fmt.width}mm`,
            height: `${fmt.height}mm`,
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });
        return Buffer.from(pdfRaw);
    } finally {
        await browser.close();
    }
}

module.exports = { generatePDF, generateBacksPDF, PAGE_FORMATS };
