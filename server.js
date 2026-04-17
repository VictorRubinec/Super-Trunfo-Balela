const express = require('express');
const path    = require('path');
const fs      = require('fs');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// Configurações básicas configuradas para Vercel / Supabase
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/api/admin',    require('./server/routes/admin'));
app.use('/api',         require('./server/routes/export'));
app.use('/api', require('./server/routes/pdf'));
app.use('/api', require('./server/routes/bundle'));

// Iniciar apenas se executado diretamente (não via Vercel/teste)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('\n🎴  Balela Trunfo');
        console.log(`    Servidor em  → http://localhost:${PORT}`);
        console.log(`    Banco de Dados → Supabase Live\n`);
    });
}

module.exports = app;
