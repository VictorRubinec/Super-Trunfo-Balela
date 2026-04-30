const express = require('express');
const { supabase } = require('../services/supabase-service');

const { authenticate, authorize } = require('../middleware/auth');

const LogService = require('../services/log-service');

const router = express.Router();

router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('nome');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
    const { nome, cor } = req.body;
    
    const { data, error } = await req.supabase
        .from('packages')
        .insert([{ nome: nome?.trim(), cor: cor || '#7B2FBE' }])
        .select();

    if (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'Um pacote com este nome já existe' });
        return res.status(500).json({ error: error.message });
    }

    // Log Auditoria
    await LogService.log({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'packages',
        recordId: data[0].id,
        newData: data[0]
    });

    res.status(201).json(data[0]);
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
    // 1. Buscar dado antigo
    const { data: oldData } = await req.supabase.from('packages').select('*').eq('id', req.params.id).single();

    const { nome, cor } = req.body;
    const { data, error } = await req.supabase
        .from('packages')
        .update({ nome: nome?.trim(), cor })
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Pacote não encontrado' });
    
    // Log Auditoria
    await LogService.log({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'packages',
        recordId: req.params.id,
        oldData: oldData,
        newData: data[0]
    });

    res.json(data[0]);
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
    // 1. Buscar dado antigo
    const { data: oldData } = await req.supabase.from('packages').select('*').eq('id', req.params.id).single();

    const { error } = await req.supabase
        .from('packages')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    // Log Auditoria
    await LogService.log({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'packages',
        recordId: req.params.id,
        oldData: oldData
    });

    res.json({ ok: true });
});

module.exports = router;
