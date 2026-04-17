const express = require('express');
const { supabase } = require('../services/supabase-service');
const LogService = require('../services/log-service');

const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper para converter colunas do DB para o formato JSON do Frontend
function mapFromDb(card) {
    return {
        ...card,
        atributos: {
            entretenimento: card.attr_ent,
            vergonha_alheia: card.attr_vgh,
            competencia:    card.attr_cmp,
            balela:         card.attr_bal,
            climao:         card.attr_clm
        }
    };
}

// Helper para converter JSON do Frontend para o formato do DB
function mapToDb(body) {
    const card = { ...body };
    if (body.atributos) {
        card.attr_ent = body.atributos.entretenimento;
        card.attr_vgh = body.atributos.vergonha_alheia;
        card.attr_cmp = body.atributos.competencia;
        card.attr_bal = body.atributos.balela;
        card.attr_clm = body.atributos.climao;
        delete card.atributos;
    }
    return card;
}

router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data.map(mapFromDb));
});

router.post('/', authenticate, authorize(['admin', 'member']), async (req, res) => {
    const cardData = mapToDb(req.body);
    
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
    // 1. Buscar dado antigo para o log
    const { data: oldData } = await req.supabase.from('cards').select('*').eq('id', req.params.id).single();
    
    const cardData = mapToDb(req.body);
    delete cardData.id; // Evitar mudar ID

    const { data, error } = await req.supabase
        .from('cards')
        .update(cardData)
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Carta não encontrada' });
    
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
