const { stringify } = require('csv-stringify/sync');
const { parse }     = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/cards.json');

function readCards() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
    catch { return []; }
}
function writeCards(cards) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
}

/** Colunas do CSV (ordem de exibição) */
const COLUMNS = [
    'id', 'titulo', 'tipo',
    'entretenimento', 'vergonha_alheia', 'competencia', 'balela', 'climao',
    'video_origem', 'frase', 'foto_arquivo', 'modelo', 'criado_em',
];

function exportToCsv() {
    const cards = readCards();

    const rows = cards.map(c => ({
        id:              c.id            || '',
        titulo:          c.titulo        || '',
        tipo:            c.tipo          || '',
        entretenimento:  c.atributos?.entretenimento  ?? 5,
        vergonha_alheia: c.atributos?.vergonha_alheia ?? 5,
        competencia:     c.atributos?.competencia     ?? 5,
        balela:          c.atributos?.balela          ?? 5,
        climao:          c.atributos?.climao          ?? 5,
        video_origem:    c.video_origem  || '',
        frase:           c.frase         || '',
        foto_arquivo:    c.foto_arquivo  || '',
        modelo:          c.modelo        || 'v1-default',
        criado_em:       c.criado_em     || '',
    }));

    return stringify(rows, { header: true, columns: COLUMNS });
}

/**
 * Importa CSV e mescla com as cartas existentes.
 * - Se o id já existe → atualiza
 * - Se não existe → cria novo
 * @param {string} csvContent
 * @returns {{ imported: number, updated: number, created: number }}
 */
function importFromCsv(csvContent) {
    const rows    = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    const cards   = readCards();
    let created   = 0;
    let updated   = 0;

    rows.forEach(row => {
        const card = {
            id:          row.id?.trim() || uuidv4(),
            titulo:      row.titulo     || '',
            tipo:        row.tipo       || '',
            atributos: {
                entretenimento:  parseInt(row.entretenimento)  || 5,
                vergonha_alheia: parseInt(row.vergonha_alheia) || 5,
                competencia:     parseInt(row.competencia)     || 5,
                balela:          parseInt(row.balela)          || 5,
                climao:          parseInt(row.climao)          || 5,
            },
            video_origem:  row.video_origem || '',
            frase:         row.frase        || '',
            foto:          row.foto_arquivo ? `/assets/photos/${row.foto_arquivo}` : '',
            foto_arquivo:  row.foto_arquivo  || '',
            modelo:        row.modelo || 'v1-default',
            criado_em:     row.criado_em || new Date().toISOString(),
        };

        const idx = cards.findIndex(c => c.id === card.id);
        if (idx !== -1) {
            cards[idx] = card;
            updated++;
        } else {
            cards.push(card);
            created++;
        }
    });

    writeCards(cards);
    return { imported: rows.length, created, updated };
}

module.exports = { exportToCsv, importFromCsv };
