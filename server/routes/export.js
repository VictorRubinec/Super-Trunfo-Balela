const express = require('express');
const multer  = require('multer');
const { exportToCsv, importFromCsv } = require('../services/csv-service');

const router = express.Router();

/* Multer em memória (CSV não precisa ser salvo em disco) */
const csvUpload = multer({ storage: multer.memoryStorage() });

router.get('/export/csv', (req, res) => {
    try {
        const csv      = exportToCsv();
        const date     = new Date().toISOString().split('T')[0];
        const filename = `balela-trunfo-${date}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // BOM para abrir corretamente no Excel/LibreOffice
        res.send('\uFEFF' + csv);
    } catch (err) {
        console.error('[export/csv]', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/import/csv', csvUpload.single('csv'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

        const csvContent = req.file.buffer.toString('utf-8')
            .replace(/^\uFEFF/, '');    // remove BOM se existir

        const result = importFromCsv(csvContent);
        res.json(result);
    } catch (err) {
        console.error('[import/csv]', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
