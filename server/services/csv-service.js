const { stringify } = require('csv-stringify/sync');
const { parse }     = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./supabase-service');
const { mapFromDb, mapToDb } = require('./data-utils');

/** Colunas do CSV (ordem de exibição) */
const COLUMNS = [
    'id', 'titulo', 'tipo',
    'entretenimento', 'vergonha_alheia', 'competencia', 'balela', 'climao',
    'video_origem', 'frase', 'foto', 'modelo', 'criado_em',
];

async function exportToCsv() {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) throw error;

    const cards = (data || []).map(mapFromDb);

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
        foto:            c.foto          || '',
        modelo:          c.modelo        || 'v1-default',
        criado_em:       c.criado_em     || '',
    }));

    return stringify(rows, { header: true, columns: COLUMNS });
}

/**
 * Importa CSV e mescla com as cartas existentes no Supabase.
 * @param {string} csvContent
 * @param {Object} authSupabase - Cliente Supabase autenticado do usuário (opcional)
 * @returns {Promise<{ imported: number, upserted: number }>}
 */
async function importFromCsv(csvContent, authSupabase = null) {
    const rows = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    if (rows.length === 0) return { imported: 0, upserted: 0 };

    const client = authSupabase || supabase;
    const cardsToUpsert = rows.map(row => {
        // Preparar objeto no formato do Frontend para usar o mapToDb
        const feCard = {
            id:          row.id?.trim() || uuidv4(),
            titulo:      row.titulo     || '',
            tipo:        row.tipo       || 'Personagem',
            atributos: {
                entretenimento:  parseInt(row.entretenimento)  || 5,
                vergonha_alheia: parseInt(row.vergonha_alheia) || 5,
                competencia:     parseInt(row.competencia)     || 5,
                balela:          parseInt(row.balela)          || 5,
                climao:          parseInt(row.climao)          || 5,
            },
            video_origem:  row.video_origem || '',
            frase:         row.frase        || '',
            foto:          row.foto         || '',
            modelo:        row.modelo       || 'v1-default',
            criado_em:     row.criado_em    || new Date().toISOString(),
        };

        return mapToDb(feCard);
    });

    const { error } = await client
        .from('cards')
        .upsert(cardsToUpsert);

    if (error) throw error;

    return { imported: rows.length, upserted: cardsToUpsert.length };
}

module.exports = { exportToCsv, importFromCsv };
