const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { supabase } = require('../services/supabase-service');

const router = express.Router();
const BUCKET = process.env.BUCKET_NAME || 'card-photos';

// Usar memória para facilitar o envio direto para o Supabase
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },   // 20 MB máx
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são aceitas'));
        }
        cb(null, true);
    },
});

const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    try {
        const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const ext = path.extname(req.file.originalname).toLowerCase();
        const fileName = `${uid}${ext}`;

        // Usar req.supabase para respeitar o RLS do Storage
        const { data, error } = await req.supabase.storage
            .from(BUCKET)
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) return res.status(500).json({ error: error.message });

        const { data: urlData } = req.supabase.storage
            .from(BUCKET)
            .getPublicUrl(fileName);

        res.json({
            filename: fileName,
            url:      urlData.publicUrl,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

module.exports = router;
