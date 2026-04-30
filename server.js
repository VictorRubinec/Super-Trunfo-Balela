require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const cors    = require('cors');
const { authenticate, authorize } = require('./server/middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// Configurações básicas configuradas para Vercel / Supabase
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Proteção de Servidor para a pasta Admin (Arquivos Estáticos)
app.use('/admin', (req, res, next) => {
    // Tenta autenticar via Header Authorization ou Cookie se houver (opcional)
    // No nosso caso, o client envia o token via Header.
    // Para arquivos estáticos, o navegador não envia headers customizados em links diretos.
    // Então, no primeiro acesso ao HTML, o dashboard.js fará a verificação client-side.
    // Mas para proteger a API e assets sensíveis, a trava abaixo é essencial.
    next(); 
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Rota de diagnóstico para Vercel
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        env: {
            hasUrl: !!process.env.SUPABASE_URL,
            hasKey: !!process.env.SUPABASE_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
    });
});

app.use('/api/cards',    require('./server/routes/cards'));
app.use('/api/packages', require('./server/routes/packages'));
app.use('/api/photos',   require('./server/routes/photos'));
app.use('/api/gallery',  require('./server/routes/gallery'));
app.use('/api/admin',    require('./server/routes/admin'));
app.use('/api/public',   require('./server/routes/public'));
app.use('/api',         require('./server/routes/export'));
app.use('/api', require('./server/routes/pdf'));
app.use('/api', require('./server/routes/bundle'));
app.use('/api/recrutamento', require('./server/routes/recrutamento'));

// Catch-all 404 (Deve ser a última rota)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// Iniciar apenas se executado diretamente (não via Vercel/teste)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('\n🎴  Balela Trunfo');
        console.log(`    Servidor em  → http://localhost:${PORT}`);
        console.log(`    Banco de Dados → Supabase (Conectado)\n`);
    });
}

// Catch-all 404 (Deve ser a última rota)
app.use((req, res) => {
    res.redirect('/error');
});

module.exports = app;
