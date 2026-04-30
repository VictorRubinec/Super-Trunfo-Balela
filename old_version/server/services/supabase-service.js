require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[Supabase] Verificando chaves...');
console.log('[Supabase] URL:', SUPABASE_URL ? '✅ Carregada' : '❌ VAZIA');
console.log('[Supabase] Anon Key:', SUPABASE_KEY ? '✅ Carregada' : '❌ VAZIA');
console.log('[Supabase] Service Key:', SUPABASE_SERVICE_ROLE_KEY ? '✅ Carregada' : '❌ VAZIA');

// Função auxiliar para criar cliente de forma segura
function safeCreateClient(url, key, name = 'Público') {
    if (!url || !key) {
        console.error(`[Supabase] Erro Crítico: Credenciais de acesso ${name} não encontradas!`);
        // Retornamos um objeto que lança erro ao ser usado, em vez de quebrar a inicialização do Node
        return new Proxy({}, {
            get: (_, prop) => {
                if (prop === 'from' || prop === 'auth' || prop === 'storage') {
                    return () => ({
                        select: () => Promise.resolve({ data: null, error: { message: `Supabase ${name} não configurado nas variáveis de ambiente.` } }),
                        insert: () => Promise.resolve({ data: null, error: { message: `Supabase ${name} não configurado nas variáveis de ambiente.` } }),
                        upload: () => Promise.resolve({ data: null, error: { message: `Supabase ${name} não configurado nas variáveis de ambiente.` } }),
                        getUser: () => Promise.resolve({ data: { user: null }, error: { message: `Supabase ${name} não configurado.` } })
                    });
                }
                return undefined;
            }
        });
    }
    return createClient(url, key);
}

const supabase = safeCreateClient(SUPABASE_URL, SUPABASE_KEY, 'Anônimo');
const adminSupabase = safeCreateClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'Service Role');

// Expõe ambos para suportar desestruturação { supabase, adminSupabase }
supabase.supabase = supabase;
supabase.adminSupabase = adminSupabase;

/**
 * Registra uma ação na tabela de auditoria
 */
supabase.logAudit = async (userId, action, description = {}, ip = '') => {
    try {
        await adminSupabase.from('audit_logs').insert({
            user_id: userId,
            action,
            description,
            ip_address: ip
        });
    } catch (err) {
        console.error('[Audit] Erro ao gravar log:', err.message);
    }
};

/**
 * Registra uma visita ao site
 */
supabase.trackVisit = async (origin, page, sessionId, userId = null) => {
    try {
        await adminSupabase.from('site_metrics').insert({
            origin: origin || 'direto',
            page_visited: page,
            session_id: sessionId,
            user_id: userId
        });
    } catch (err) {
        console.error('[Metrics] Erro ao rastrear visita:', err.message);
    }
};

module.exports = supabase;
