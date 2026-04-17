const express = require('express');
const { generatePDF, generateBacksPDF, PAGE_FORMATS } = require('../services/pdf-service');
const { supabase } = require('../services/supabase-service');
const { mapFromDb } = require('../services/data-utils');

const router = express.Router();
const PORT   = process.env.PORT || 3000;

/**
 * Retorna as cartas do Supabase formatadas para o Frontend
 */
async function getCardsFromSupabase() {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        console.error('[pdf-db] Erro ao buscar cartas:', error.message);
        return [];
    }
    return (data || []).map(mapFromDb);
}

router.get('/export/pdf', async (req, res) => {
    const format    = req.query.format    || 'a4';
    const cutmarks  = req.query.cutmarks  === 'true';
    const bleed     = parseFloat(req.query.bleed || '3');

    if (!PAGE_FORMATS[format]) {
        return res.status(400).json({ error: `Formato inválido: ${format}` });
    }

    const cards = await getCardsFromSupabase();
    if (cards.length === 0) {
        return res.status(400).json({ error: 'Nenhuma carta para gerar o PDF no banco de dados' });
    }

    console.log(`[pdf] Gerando PDF (Supabase): ${format} | cutmarks=${cutmarks} | ${cards.length} cartas`);

    try {
        const pdfBuffer = await generatePDF(cards, format, cutmarks, bleed, PORT);
        const fmt   = PAGE_FORMATS[format];
        const date  = new Date().toISOString().split('T')[0];
        const marks = cutmarks ? '-com-cortes' : '';
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

    const cards = await getCardsFromSupabase();
    if (cards.length === 0) {
        return res.status(400).json({ error: 'Nenhuma carta para gerar o verso' });
    }

    console.log(`[pdf-back] Gerando Versos (Supabase): ${format} | ${cards.length} cartas`);

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
