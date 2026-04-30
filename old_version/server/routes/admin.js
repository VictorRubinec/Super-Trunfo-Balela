const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { supabase, adminSupabase, trackVisit, logAudit } = require('../services/supabase-service');
const EmailService = require('../services/emailService');
const DriveService = require('../services/driveService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Verificar cargo do usuário atual (Usado pelo Dashboard)
router.get('/check-role', authenticate, async (req, res) => {
    try {
        const { data, error } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Perfil não encontrado' });
        res.json({ role: data.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Listar todos os perfis (Apenas para Admins)
 */
router.get('/users', authenticate, authorize(['admin']), async (req, res) => {
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
        
        if (profileError) throw profileError;

        // Registrar na auditoria
        await logAudit(req.user.id, 'INVITE_USER', { invited_email: email, role: role || 'member' });

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
    // Buscamos apenas os logs primeiro usando o cliente admin para ignorar RLS
    const { data: logs, error: logsError } = await adminSupabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (logsError) return res.status(500).json({ error: logsError.message });

    // Enriquecer os logs com o email do perfil se possível
    try {
        const userIds = [...new Set(logs.map(l => l.user_id).filter(id => id))];
        
        if (userIds.length > 0) {
            const { data: profiles } = await adminSupabase
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

    // Registrar na auditoria
    await logAudit(req.user.id, 'CHANGE_ROLE', { target_id: id, new_role: role });

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

    // Registrar na auditoria
    await logAudit(req.user.id, 'DELETE_USER', { target_id: id });

    res.json({ message: 'Usuário removido da equipe' });
});

/**
 * Alterar Cargo de um Usuário
 */
router.patch('/users/:id/role', authenticate, authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'member', 'visitor'].includes(role)) {
        return res.status(400).json({ error: 'Cargo inválido' });
    }

    try {
        const { data, error } = await adminSupabase
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, 'CHANGE_USER_ROLE', { target_id: id, new_role: role });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Convidar novo usuário por e-mail
 */
router.post('/users/invite', authenticate, authorize(['admin']), async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });
    try {
        const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${req.headers.origin}/admin`
        });
        if (error) throw error;
        await logAudit(req.user.id, 'INVITE_USER', { email });
        res.json({ message: 'Convite enviado!', data });
    } catch (err) {
        console.error('[Admin] Erro ao convidar:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Buscar Perfil de Usuário
 */
router.get('/profiles/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    
    const { data, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return res.status(404).json({ error: 'Perfil não encontrado' });
    res.json(data);
});

/**
 * Atualizar Perfil de Usuário (Com Upload de Avatar)
 */
router.put('/profiles/:id', authenticate, upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    const { display_name, bio, show_on_team, social_links } = req.body;
    
    // Apenas o próprio usuário ou admin pode editar
    if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Não autorizado' });
    }

    try {
        let avatar_url = undefined;

        // 1. Processar Upload de Avatar se enviado
        if (req.file) {
            const fileExt = req.file.originalname.split('.').pop();
            const fileName = `${id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await adminSupabase.storage
                .from('avatars')
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Obter URL pública
            const { data: { publicUrl } } = adminSupabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            avatar_url = publicUrl;
        }

        // 2. Atualizar Perfil no Banco
        const updateData = {
            display_name,
            bio,
            show_on_team: show_on_team === 'true' || show_on_team === true,
            social_links: JSON.parse(social_links || '[]')
        };

        if (avatar_url) updateData.avatar_url = avatar_url;

        const { data: profile, error: updateError } = await adminSupabase
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Registrar na auditoria
        await logAudit(req.user.id, 'UPDATE_PROFILE', { target_id: id });

        res.json(profile);
    } catch (err) {
        console.error('[Admin] Erro ao atualizar perfil:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Dashboard: Métricas de Tráfego e Armazenamento
 */
router.get('/dashboard', authenticate, authorize(['admin']), async (req, res) => {
    try {
        // 1. Tráfego (Origens)
        const { data: metrics } = await adminSupabase
            .from('site_metrics')
            .select('origin');
        
        const origins = (metrics || []).reduce((acc, m) => {
            acc[m.origin] = (acc[m.origin] || 0) + 1;
            return acc;
        }, {});

        // 2. Armazenamento Drive
        const driveQuota = await DriveService.getStorageQuota();

        // 3. Armazenamento Supabase (Simulado ou via Postgres se possível)
        // Por limitações da API JS do Supabase, retornamos valores fixos ou baseados em contagem
        const { data: files } = await adminSupabase.storage.from('card-photos').list();
        const storageUsed = (files || []).reduce((acc, f) => acc + (f.metadata?.size || 0), 0);

        res.json({
            traffic: origins,
            storage: {
                drive: driveQuota,
                supabase: {
                    used: storageUsed,
                    total: 500 * 1024 * 1024 // 500MB plano free
                }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Rastreamento de Visita (Público)
 */
router.post('/track', async (req, res) => {
    const { origin, page, sessionId } = req.body;
    await trackVisit(origin, page, sessionId);
    res.json({ ok: true });
});

module.exports = router;
