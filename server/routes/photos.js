const express = require('express');
const multer  = require('multer');
const path    = require('path');

const router = express.Router();

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../assets/photos'),
    filename: (req, file, cb) => {
        const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uid}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },   // 20 MB máx
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são aceitas'));
        }
        cb(null, true);
    },
});

router.post('/', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    res.json({
        filename: req.file.filename,
        url:      `/assets/photos/${req.file.filename}`,
    });
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

module.exports = router;
