/**
 * Classe base para modelos de carta.
 * Todo modelo deve extender esta classe e implementar os métodos abaixo.
 */
export class CardModel {
    static id   = 'base';
    static name = 'Modelo Base';

    /**
     * Atualiza o DOM do card de preview com os dados da carta.
     * @param {Object} cardData  — dados da carta
     * @param {string} previewId — ID do elemento card no DOM
     */
    static update(cardData, previewId) {
        throw new Error(`[CardModel] update() não implementado pelo modelo "${this.id}"`);
    }

    /**
     * Gera o HTML completo da carta (para galeria e Puppeteer/PDF).
     * @param {Object} cardData — dados da carta
     * @returns {string} HTML string da carta
     */
    static toHTML(cardData) {
        throw new Error(`[CardModel] toHTML() não implementado pelo modelo "${this.id}"`);
    }
}
