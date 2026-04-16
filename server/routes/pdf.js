const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { generatePDF, generateBacksPDF, PAGE_FORMATS } = require('../services/pdf-service');

const router    = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/cards.json');
const PORT      = process.env.PORT || 3000;

function readCards() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
    catch { return []; }
}

router.get('/export/pdf', async (req, res) => {
    const format    = req.query.format    || 'a4';
    const cutmarks  = req.query.cutmarks  === 'true';
    const bleed     = parseFloat(req.query.bleed || '3');

    if (!PAGE_FORMATS[format]) {
        return res.status(400).json({ error: `Formato inválido: ${format}` });
    }

    const cards = readCards();
    if (cards.length === 0) {
        return res.status(400).json({ error: 'Nenhuma carta para gerar o PDF' });
    }

    console.log(`[pdf] Gerando PDF: ${format} | cutmarks=${cutmarks} | ${cards.length} cartas`);

    try {
        const pdfBuffer = await generatePDF(cards, format, cutmarks, bleed, PORT);
        const fmt   = PAGE_FORMATS[format];
        const date  = new Date().toISOString().split('T')[0];
        const marks = cutmarks ? '-com-cores' : '';
        const filename = `balela-trunfo-${fmt.label.toLowerCase().replace(' ', '-')}-${date}${marks}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

        console.log(`[pdf] PDF gerado com sucesso: ${filename}`);
    } catch (err) {
        console.error('[pdf] Erro ao gerar PDF:', err);
        res.status(500).json({ error: 'Erro ao gerar PDF: ' + err.message });
    }
});

router.get('/export/pdf-backs', async (req, res) => {
    const format = req.query.format || 'a4';
    const bleed  = parseFloat(req.query.bleed || '3');

    if (!PAGE_FORMATS[format]) {
        return res.status(400).json({ error: `Formato inválido: ${format}` });
    }

    const cards = readCards();
    if (cards.length === 0) {
        return res.status(400).json({ error: 'Nenhuma carta para gerar o verso' });
    }

    console.log(`[pdf-back] Gerando Versos: ${format} | ${cards.length} cartas`);

    try {
        const cutmarks  = req.query.cutmarks === 'true';
        const pdfBuffer = await generateBacksPDF(cards, format, cutmarks, bleed, PORT);
        const fmt  = PAGE_FORMATS[format];
        const date = new Date().toISOString().split('T')[0];
        const filename = `balela-trunfo-versos-${fmt.label.toLowerCase().replace(' ', '-')}-${date}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

        console.log(`[pdf-back] PDF de versos gerado com sucesso: ${filename}`);
    } catch (err) {
        console.error('[pdf-back] Erro ao gerar PDF de versos:', err);
        res.status(500).json({ error: 'Erro ao gerar PDF de versos: ' + err.message });
    }
});

module.exports = router;
