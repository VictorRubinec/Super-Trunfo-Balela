require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey || serviceKey.includes('AQUI')) {
    console.error('❌ Erro: Configure as chaves reais no .env antes de rodar este script.');
    process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceKey);

async function fixAdmin(email) {
    console.log(`\n🚀 Iniciando promoção para: ${email}...`);

    try {
        // 1. Buscar o usuário no Auth do Supabase
        const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
        if (listError) throw listError;

        const targetUser = users.find(u => u.email === email);
        if (!targetUser) {
            console.error(`❌ Usuário com e-mail ${email} não encontrado no Supabase Auth.`);
            return;
        }

        console.log(`✅ Usuário encontrado! ID: ${targetUser.id}`);

        // 2. Upsert no perfil com role admin
        const { error: upsertError } = await adminSupabase
            .from('profiles')
            .upsert({
                id: targetUser.id,
                email: email,
                role: 'admin'
            });

        if (upsertError) throw upsertError;

        console.log(`\n🏆 SUCESSO! O usuário ${email} agora é um ADMINISTRADOR.`);
        console.log(`Pode fechar este script e recarregar o dashboard.\n`);

    } catch (err) {
        console.error('❌ Erro durante o processo:', err.message);
    }
}

// PEGAR O E-MAIL DO SEU USUÁRIO AQUI (Ajuste se necessário)
const userEmail = 'vrubinec@gmail.com'; // Coloque o e-mail que você usa para logar
fixAdmin(userEmail);
