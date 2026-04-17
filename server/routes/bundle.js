const express = require('express');
const AdmZip  = require('adm-zip');
const { generatePDF, generateBacksPDF, PAGE_FORMATS } = require('../services/pdf-service');
const { supabase } = require('../services/supabase-service');
const { mapFromDb } = require('../services/data-utils');

const router = express.Router();
const PORT   = process.env.PORT || 3000;

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

    const idList = ids.split(',').filter(id => id.trim() !== '');
    if (idList.length === 0) {
        return res.status(400).json({ error: 'Lista de IDs vazia' });
    }

    try {
        // Buscar cartas do Supabase pelos IDs
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .in('id', idList);

        if (error) throw error;

        // Mapear para o formato do Frontend
        const fetchedCards = (data || []).map(mapFromDb);
        
        // Reconstruir a lista respeitando a ordem e duplicatas enviadas no idList
        const selectedCards = idList.map(id => fetchedCards.find(c => c.id === id)).filter(Boolean);

        if (selectedCards.length === 0) {
            return res.status(400).json({ error: 'Cartas selecionadas não encontradas no banco de dados' });
        }

        console.log(`[bundle] Gerando bundle ZIP (Supabase): "${projectName}" | format=${formatKey} | cards=${selectedCards.length}`);
        const zip = new AdmZip();

        // Dividir em chunks de N páginas para evitar timeout do Puppeteer/Vercel
        // 27 cartas = 3 páginas de 9 cartas cada (tamanho seguro para Vercel)
        const CARDS_PER_CHUNK = 27; 
        const chunks = [];
        for (let i = 0; i < selectedCards.length; i += CARDS_PER_CHUNK) {
            chunks.push(selectedCards.slice(i, i + CARDS_PER_CHUNK));
        }

        console.log(`[bundle] Dividindo em ${chunks.length} lotes de processamento...`);

        // Processar cada chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunkCards = chunks[i];
            const startPage = i * 3 + 1;
            const endPage   = startPage + Math.ceil(chunkCards.length / 9) - 1;
            const suffix    = `_paginas_${startPage}_${endPage}`;

            console.log(`[bundle] Processando lote ${i+1}/${chunks.length} (${chunkCards.length} cartas)...`);

            // Gerar PDFs do lote em paralelo
            const [pdfFrentes, pdfVersos] = await Promise.all([
                generatePDF(chunkCards, formatKey, isCutmarks, bleedVal, PORT),
                generateBacksPDF(chunkCards, formatKey, isCutmarks, bleedVal, PORT)
            ]);

            zip.addFile(`frentes${suffix}.pdf`, pdfFrentes);
            zip.addFile(`versos${suffix}.pdf`, pdfVersos);
        }

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
