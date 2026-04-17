require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[Supabase] Credenciais não encontradas no .env. Verifique SUPABASE_URL e SUPABASE_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Cliente administrativo que ignora RLS (Use apenas no servidor!)
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Expõe ambos para suportar desestruturação { supabase, adminSupabase }
supabase.supabase = supabase;
supabase.adminSupabase = adminSupabase;

module.exports = supabase;
