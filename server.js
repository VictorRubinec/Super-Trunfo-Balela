const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR   = path.join(__dirname, 'data');
const PHOTOS_DIR = path.join(__dirname, 'assets', 'photos');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');

if (!fs.existsSync(DATA_DIR))   fs.mkdirSync(DATA_DIR,   { recursive: true });
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });
if (!fs.existsSync(CARDS_FILE)) fs.writeFileSync(CARDS_FILE, '[]', 'utf-8');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

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
        console.log(`    Dados em     → ${CARDS_FILE}`);
        console.log(`    Fotos em     → ${PHOTOS_DIR}\n`);
    });
}

module.exports = app;
