const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { supabase, adminSupabase } = require('../services/supabase-service');

const router = express.Router();

/**
 * Listar todos os perfis (Apenas para Admins)
 */
router.get('/profiles', authenticate, authorize(['admin']), async (req, res) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

/**
 * Convidar novo usuário (Apenas para Admins)
 */
router.post('/invite', authenticate, authorize(['admin']), async (req, res) => {
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });

    // 1. Convidar via Supabase Auth
    const { data: { user }, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: { initial_role: role || 'member' },
        redirectTo: `${req.protocol}://${req.get('host')}/#type=invite`
    });

    if (inviteError) return res.status(500).json({ error: inviteError.message });

    // 2. Garantir que o perfil seja criado/atualizado com a role correta
    // Geralmente o trigger do Supabase cuida disso, mas vamos reforçar
    await adminSupabase.from('profiles').upsert({
        id: user.id,
        email: email,
        role: role || 'member'
    });

    res.json({ ok: true, message: `Convite enviado para ${email}` });
});

/**
 * Criar Usuário Diretamente (Apenas para Admins)
 */
router.post('/users', authenticate, authorize(['admin']), async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    // 1. Criar no Supabase Auth
    const { data: { user }, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { initial_role: role || 'member' }
    });

    if (createError) return res.status(500).json({ error: createError.message });

    // 2. Criar Perfil
    const { error: profileError } = await adminSupabase.from('profiles').upsert({
        id: user.id,
        email: email,
        role: role || 'member'
    });

    if (profileError) return res.status(500).json({ error: profileError.message });

    res.json({ ok: true, message: `Usuário ${email} criado com sucesso!` });
});

/**
 * Listar logs de auditoria (Apenas para Admins)
 */
router.get('/logs', authenticate, authorize(['admin']), async (req, res) => {
    const { data, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            profiles:user_id (email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});


router.put('/profiles/:id/role', authenticate, authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const { error } = await adminSupabase
        .from('profiles')
        .update({ role })
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Cargo atualizado com sucesso' });
});

// Remover usuário
router.delete('/profiles/:id', authenticate, authorize(['admin']), async (req, res) => {
    const { id } = req.params;

    // Nota: Aqui removemos do perfil. Para remover do Supabase Auth exige mais lógica ou Cascade.
    const { error } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Usuário removido da equipe' });
});

module.exports = router;
