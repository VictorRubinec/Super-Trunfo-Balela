require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
    console.log('🚀 Iniciando configuração do Perfil...');

    // 1. Criar Bucket de Avatares (se não existir)
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;

    if (!buckets.find(b => b.name === 'avatars')) {
        console.log('📁 Criando bucket "avatars"...');
        await supabase.storage.createBucket('avatars', { public: true });
    } else {
        console.log('✅ Bucket "avatars" já existe.');
    }

    // 2. Adicionar colunas à tabela profiles (Via RPC ou assumindo que o usuário tem acesso)
    // Como não podemos rodar ALTER TABLE diretamente via cliente JS sem uma função RPC, 
    // vou tentar fazer um insert/update teste para ver se as colunas existem.
    
    console.log('🔍 Verificando estrutura da tabela profiles...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
        console.error('❌ Erro ao ler perfis:', error.message);
        return;
    }

    const columns = Object.keys(data[0] || {});
    const missing = ['display_name', 'bio', 'avatar_url', 'social_links', 'show_on_team'].filter(c => !columns.includes(c));

    if (missing.length > 0) {
        console.log('⚠️ Faltam colunas:', missing.join(', '));
        console.log('👉 Por favor, execute o seguinte SQL no console do Supabase:');
        console.log(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS display_name TEXT,
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS avatar_url TEXT,
            ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS show_on_team BOOLEAN DEFAULT FALSE;
        `);
    } else {
        console.log('✅ Todas as colunas necessárias já existem!');
    }
}

setup();
