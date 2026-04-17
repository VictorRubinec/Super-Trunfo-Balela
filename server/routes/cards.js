const express = require('express');
const { supabase } = require('../services/supabase-service');
const LogService = require('../services/log-service');
const { authenticate, authorize } = require('../middleware/auth');
const { mapFromDb, mapToDb } = require('../services/data-utils');

const router = express.Router();

router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json((data || []).map(mapFromDb));
});

router.post('/', authenticate, authorize(['admin', 'member']), async (req, res) => {
    const cardData = mapToDb(req.body);
    
    // Validação de Campos Obrigatórios
    if (!cardData.titulo || !cardData.video_origem) {
        return res.status(400).json({ error: 'Título e Pacote são obrigatórios.' });
    }

    if (!cardData.foto) {
        return res.status(400).json({ error: 'A foto da carta é obrigatória.' });
    }

    // Garantir que nenhum ID (vazio ou não) seja enviado na criação
    delete cardData.id; 

    const { data, error } = await req.supabase
        .from('cards')
        .insert([{ 
            ...cardData, 
            user_id: req.user.id, // Vínculo com o dono
            criado_em: new Date().toISOString() 
        }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    
    // Log Auditoria
    await LogService.log({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'cards',
        recordId: data[0].id,
        newData: data[0]
    });

    res.status(201).json(mapFromDb(data[0]));
});

router.put('/:id', authenticate, authorize(['admin', 'member']), async (req, res) => {
    // 1. Buscar dado antigo para o log (usando o cliente autenticado para garantir permissão)
    const { data: oldData } = await req.supabase.from('cards').select('*').eq('id', req.params.id).single();
    
    if (!oldData) return res.status(404).json({ error: 'Carta não encontrada ou acesso negado' });

    const cardData = mapToDb(req.body);

    // Validação de Campos Obrigatórios na Edição
    if (!cardData.titulo || !cardData.video_origem) {
        return res.status(400).json({ error: 'Título e Pacote são obrigatórios.' });
    }

    if (!cardData.foto) {
        return res.status(400).json({ error: 'A foto da carta é obrigatória.' });
    }

    delete cardData.id; // Evitar mudar ID

    const { data, error } = await req.supabase
        .from('cards')
        .update(cardData)
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Falha ao atualizar carta' });
    
    // Log Auditoria
    await LogService.log({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'cards',
        recordId: req.params.id,
        oldData: oldData,
        newData: data[0]
    });

    res.json(mapFromDb(data[0]));
});

router.delete('/:id', authenticate, authorize(['admin', 'member']), async (req, res) => {
    // 1. Buscar dado antigo para o log
    const { data: oldData } = await req.supabase.from('cards').select('*').eq('id', req.params.id).single();

    if (!oldData) return res.status(404).json({ error: 'Carta não encontrada ou acesso negado' });

    const { error } = await req.supabase
        .from('cards')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    // Log Auditoria
    await LogService.log({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'cards',
        recordId: req.params.id,
        oldData: oldData
    });

    res.json({ ok: true });
});

module.exports = router;
