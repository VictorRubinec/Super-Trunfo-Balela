const express = require('express');
const DriveService = require('../services/driveService');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/supabase-service');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

/**
 * Rota para criar um novo álbum (apenas admin)
 */
router.post('/folders', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Nome do álbum é obrigatório' });

        const folder = await DriveService.createFolder(name);
        
        // Auditoria
        await logAudit(req.user.id, 'CREATE_ALBUM', { folder_id: folder.id, name });
        
        res.json({ success: true, folder });
    } catch (err) {
        console.error('[GalleryRoute] Erro ao criar álbum:', err);
        res.status(500).json({ error: 'Falha ao criar álbum no Google Drive' });
    }
});

/**
 * Rota para excluir uma foto ou álbum (apenas admin)
 */
router.delete('/file/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const fileId = req.params.id;
        await DriveService.deleteFile(fileId);
        
        // Auditoria
        await logAudit(req.user.id, 'DELETE_GALLERY_ITEM', { file_id: fileId });
        
        res.json({ success: true, message: 'Item excluído com sucesso' });
    } catch (err) {
        console.error('[GalleryRoute] Erro ao excluir:', err);
        res.status(500).json({ error: 'Falha ao excluir item no Google Drive' });
    }
});

/**
 * Rota para renomear uma foto ou álbum (apenas admin)
 */
router.put('/file/:id/rename', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Novo nome é obrigatório' });

        const id = req.params.id;
        const item = await DriveService.renameFile(id, name);
        
        // Auditoria
        await logAudit(req.user.id, 'RENAME_GALLERY_ITEM', { id, new_name: name });
        
        res.json({ success: true, item });
    } catch (err) {
        console.error('[GalleryRoute] Erro ao renomear:', err);
        res.status(500).json({ error: 'Falha ao renomear item no Google Drive' });
    }
});

/**
 * Rota para upload de capa (substitui a anterior)
 */
router.post('/folders/:id/cover', authenticate, authorize(['admin']), upload.single('cover'), async (req, res) => {
    try {
        const folderId = req.params.id;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        // 1. Buscar se já existe uma capa
        const photos = await DriveService.listImages(folderId);
        const oldCover = photos.find(p => p.name.toLowerCase().startsWith('capa.'));

        // 2. Apagar a antiga se existir
        if (oldCover) {
            await DriveService.deleteFile(oldCover.id);
        }

        // 3. Subir a nova com nome 'capa'
        const ext = req.file.originalname.split('.').pop();
        const newName = `capa.${ext}`;
        
        const newCover = await DriveService.uploadFile(newName, folderId, req.file.buffer, req.file.mimetype);

        // Auditoria
        await logAudit(req.user.id, 'UPDATE_ALBUM_COVER', { folder_id: folderId, file_id: newCover.id });

        res.json({ success: true, cover: newCover });
    } catch (err) {
        console.error('[GalleryRoute] Erro fatal no upload da capa:', err);
        res.status(500).json({ error: 'Erro ao processar upload da capa' });
    }
});

/**
 * Rota para obter as fotos da galeria do Google Drive
 */
router.get('/', async (req, res) => {
    try {
        const { folderId } = req.query; // Aceita ID de subpasta opcional
        const photos = await DriveService.listImages(folderId);
        res.json(photos);
    } catch (err) {
        console.error('[GalleryRoute] Erro:', err);
        res.status(500).json({ error: 'Falha ao carregar fotos da galeria' });
    }
});

/**
 * Rota para listar as gravações (subpastas)
 */
router.get('/folders', async (req, res) => {
    try {
        const folders = await DriveService.listFolders();
        res.json(folders);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar gravações' });
    }
});

/**
 * Proxy para carregar imagens do Drive com segurança e cache
 */
router.get('/image/:id', async (req, res) => {
    try {
        const stream = await DriveService.getFileStream(req.params.id);
        if (!stream) return res.status(404).send('Imagem não encontrada');
        
        // Cache de 1 dia para performance
        res.setHeader('Cache-Control', 'public, max-age=86400');
        // O Drive não envia o Content-Type no stream alt=media, 
        // mas as imagens são renderizadas corretamente pelo browser.
        stream.pipe(res);
    } catch (err) {
        console.error('[GalleryProxy] Erro:', err);
        res.status(500).send('Erro ao processar imagem');
    }
});

module.exports = router;
