const express = require('express');
const fs      = require('fs');
const path    = require('path');
const AdmZip  = require('adm-zip');
const { generatePDF, generateBacksPDF, PAGE_FORMATS } = require('../services/pdf-service');

const router    = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/cards.json');
const PORT      = process.env.PORT || 3000;

function readCards() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
    catch { return []; }
}

router.post('/export/bundle', async (req, res) => {
    const { format, cutmarks, bleed, name, ids } = req.body;
    const formatKey = format || 'a4';
    const isCutmarks = cutmarks === true;
    const bleedVal = parseFloat(bleed || '3');
    const projectName = (name || 'Balela_Trunfo').replace(/[^a-z0-9_\-]/gi, '_');

    if (!PAGE_FORMATS[formatKey]) {
        return res.status(400).json({ error: `Formato inválido: ${formatKey}` });
    }

    if (!ids) {
        return res.status(400).json({ error: 'Nenhuma carta selecionada' });
    }

    const idList = ids.split(',');
    const allCards = readCards();
    
    // Construir a lista de cartas conforme os IDs enviados (incluindo duplicatas)
    const selectedCards = idList.map(id => allCards.find(c => c.id === id)).filter(Boolean);

    if (selectedCards.length === 0) {
        return res.status(400).json({ error: 'Cartas selecionadas não encontradas no servidor' });
    }

    console.log(`[bundle] Gerando bundle ZIP: "${projectName}" | format=${formatKey} | cards=${selectedCards.length}`);

    try {
        // Gerar PDFs sequencialmente
        const pdfFrentes = await generatePDF(selectedCards, formatKey, isCutmarks, bleedVal, PORT);
        const pdfVersos  = await generateBacksPDF(selectedCards, formatKey, isCutmarks, bleedVal, PORT);

        // Criar ZIP
        const zip = new AdmZip();
        zip.addFile('frentes.pdf', pdfFrentes);
        zip.addFile('versos.pdf', pdfVersos);

        const zipBuffer = zip.toBuffer();
        const filename = `${projectName}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(zipBuffer);

        console.log(`[bundle] ZIP gerado com sucesso: ${filename}`);
    } catch (err) {
        console.error('[bundle] Erro ao gerar bundle ZIP:', err);
        res.status(500).json({ error: 'Erro ao gerar exportação: ' + err.message });
    }
});

module.exports = router;
