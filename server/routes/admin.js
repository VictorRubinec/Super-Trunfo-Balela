const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { supabase, adminSupabase } = require('../services/supabase-service');
const EmailService = require('../services/emailService');

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

    try {
        // 1. Gerar link de convite via Supabase
        const { data: { properties }, error: linkError } = await adminSupabase.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                data: { initial_role: role || 'member' },
                redirectTo: `${req.protocol}://${req.get('host')}/#type=invite`
            }
        });

        if (linkError) throw linkError;

        // 2. Enviar via Resend
        await EmailService.sendInvite(email, properties.action_link);

        // 3. Garantir que o perfil exista (opcional, pois o link criará se clicar, mas melhor garantir)
        // Nota: O adminSupabase.auth.admin.generateLink já garante que o usuário existe no Auth
        const { data: { user } } = await adminSupabase.auth.admin.getUserByEmail(email);
        
        await adminSupabase.from('profiles').upsert({
            id: user.id,
            email: email,
            role: role || 'member'
        });

        res.json({ ok: true, message: `Convite enviado via Resend para ${email}` });
    } catch (err) {
        console.error('[Admin] Erro ao convidar:', err);
        res.status(500).json({ error: err.message });
    }
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
    // Buscamos apenas os logs primeiro para evitar erro de relacionamento no cache do schema
    const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (logsError) return res.status(500).json({ error: logsError.message });

    // Enriquecer os logs com o email do perfil se possível
    try {
        const userIds = [...new Set(logs.map(l => l.user_id).filter(id => id))];
        
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', userIds);
            
            const profileMap = (profiles || []).reduce((acc, p) => {
                acc[p.id] = p.email;
                return acc;
            }, {});

            const enrichedLogs = logs.map(l => ({
                ...l,
                profiles: l.user_id ? { email: profileMap[l.user_id] || 'N/A' } : null
            }));
            
            return res.json(enrichedLogs);
        }
        
        res.json(logs);
    } catch (err) {
        console.error('[Admin] Erro ao enriquecer logs:', err);
        res.json(logs); // Retorna os logs básicos se o enriquecimento falhar
    }
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
