require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

module.exports = supabase;
