const https = require('https');

// Substitua pela URL final do seu site no Vercel/Render
const APP_URL = process.env.APP_URL || 'https://seu-app.vercel.app';

console.log(`[Keep-Alive] Enviando ping para ${APP_URL}...`);

https.get(APP_URL, (res) => {
    console.log(`[Keep-Alive] Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('[Keep-Alive] Sucesso! Supabase permanecerá ativo.');
    }
}).on('error', (err) => {
    console.error('[Keep-Alive] Erro ao enviar ping:', err.message);
});
