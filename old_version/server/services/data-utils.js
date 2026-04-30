/**
 * Utilitários para mapeamento de dados entre Banco de Dados e Frontend
 */

/**
 * Converte colunas do DB (attr_ent, attr_vgh, etc) para o formato de objeto do Frontend (atributos: { entretenimento, ... })
 */
function mapFromDb(card) {
    if (!card) return null;
    return {
        ...card,
        atributos: {
            entretenimento: card.attr_ent ?? 5,
            vergonha_alheia: card.attr_vgh ?? 5,
            competencia:    card.attr_cmp ?? 5,
            balela:         card.attr_bal ?? 5,
            climao:         card.attr_clm ?? 5
        }
    };
}

/**
 * Converte o objeto do Frontend para o formato de colunas do DB
 */
function mapToDb(body) {
    if (!body) return null;
    const card = { ...body };
    if (body.atributos) {
        card.attr_ent = body.atributos.entretenimento;
        card.attr_vgh = body.atributos.vergonha_alheia;
        card.attr_cmp = body.atributos.competencia;
        card.attr_bal = body.atributos.balela;
        card.attr_clm = body.atributos.climao;
        delete card.atributos;
    }
    return card;
}

module.exports = { mapFromDb, mapToDb };
