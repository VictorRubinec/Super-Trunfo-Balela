import { CardModel } from './card-model.js';
import { colorVars } from '../utils/color-utils.js';

const ATTR_KEYS = [
    { key: 'entretenimento',  label: 'ENTRETENIMENTO:' },
    { key: 'vergonha_alheia', label: 'VERGONHA ALHEIA:' },
    { key: 'competencia',     label: 'COMPETÊNCIA:' },
    { key: 'balela',          label: 'BALELA:' },
    { key: 'climao',          label: 'CLIMÃO:' },
];

function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class ShowcaseModel extends CardModel {
    static id   = 'v6-showcase';
    static name = 'Video';

    static getHtmlStructure() {
        return `
            <div class="card v6-showcase" id="card-preview" style="--c-base: #7B2FBE;">
                <div class="card-inner">
                    <div class="v6-title-banner">
                        <span class="card-title-text">SEM TÍTULO</span>
                    </div>

                    <div class="v6-photo-container">
                        <img class="card-photo" src="" alt="" style="display:none;" draggable="false" />
                        <div class="card-photo-placeholder">
                            <span>16:9 ART</span>
                        </div>
                    </div>

                    <div class="v6-badge-row">
                        <span class="card-tipo-badge">PERSONAGEM</span>
                    </div>

                    <div class="v6-attributes">
                        ${ATTR_KEYS.map(({ label }) => `
                            <div class="attr-row">
                                <span class="attr-label">${label}</span>
                                <span class="attr-value">5/10</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="v6-phrase-banner">
                        <span class="card-phrase-text">"..."</span>
                    </div>
                    <div class="v6-footer">
                        <span class="card-pacote">PACOTE BÁSICO</span>
                    </div>
                </div>
            </div>`;
    }

    static update(cardData, previewId = 'card-preview') {
        const card = document.getElementById(previewId);
        if (!card) return;

        card.style.cssText = colorVars(cardData.cor || '#7B2FBE');

        const safeUpper = (val, fallback) => (val ? val.toString().toUpperCase() : fallback);

        if (card.querySelector('.card-title-text'))  card.querySelector('.card-title-text').textContent = safeUpper(cardData.titulo, 'SEM TÍTULO');
        if (card.querySelector('.card-tipo-badge'))  card.querySelector('.card-tipo-badge').textContent = safeUpper(cardData.tipo, 'PERSONAGEM');
        if (card.querySelector('.card-phrase-text')) card.querySelector('.card-phrase-text').textContent = cardData.frase || '"..."';
        if (card.querySelector('.card-pacote'))      card.querySelector('.card-pacote').textContent = safeUpper(cardData.video_origem, 'PACOTE BÁSICO');

        const photoEl = card.querySelector('.card-photo');
        const placeholderEl = card.querySelector('.card-photo-placeholder');
        if (cardData.foto) {
            if (photoEl) { 
                photoEl.src = cardData.foto; 
                photoEl.style.display = 'block'; 
                const zoom = cardData.zoom || 1;
                const px   = cardData.pos_x || 0;
                const py   = cardData.pos_y || 0;
                photoEl.style.transform = `translate(${px}px, ${py}px) scale(${zoom})`;
            }
            if (placeholderEl) placeholderEl.style.display = 'none';
        } else {
            if (photoEl) photoEl.style.display = 'none';
            if (placeholderEl) placeholderEl.style.display = 'flex';
        }

        const attrValues = card.querySelectorAll('.v6-attributes .attr-value');
        ATTR_KEYS.forEach(({ key }, i) => {
            if (attrValues[i]) attrValues[i].textContent = `${cardData.atributos?.[key] ?? 5}/10`;
        });
    }

    static toHTML(cardData) {
        const photoHTML = cardData.foto 
            ? `<img class="card-photo" src="${esc(cardData.foto)}" alt="" style="transform: translate(${cardData.pos_x || 0}px, ${cardData.pos_y || 0}px) scale(${cardData.zoom || 1});" draggable="false" />` 
            : `<div class="card-photo-placeholder"><span>16:9 ART</span></div>`;

        const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
            <div class="attr-row">
                <span class="attr-label">${label}</span>
                <span class="attr-value">${cardData.atributos?.[key] ?? 5}/10</span>
            </div>`).join('');

        const safeUpper = (val, fallback) => (val ? val.toString().toUpperCase() : fallback);

        return `
            <div class="card v6-showcase" data-card-id="${esc(cardData.id)}" style="${colorVars(cardData.cor || '#7B2FBE')}">
                <div class="card-inner">
                    <div class="v6-title-banner">
                        <span class="card-title-text">${esc(safeUpper(cardData.titulo, 'SEM TÍTULO'))}</span>
                    </div>

                    <div class="v6-photo-container">
                        ${photoHTML}
                    </div>

                    <div class="v6-badge-row">
                        <span class="card-tipo-badge">${esc(safeUpper(cardData.tipo, 'PERSONAGEM'))}</span>
                    </div>

                    <div class="v6-attributes">
                        ${attrRowsHTML}
                    </div>

                    <div class="v6-phrase-banner">
                        <span class="card-phrase-text">${esc(cardData.frase || '"..."')}</span>
                    </div>
                    <div class="v6-footer">
                        <span class="card-pacote">${esc(safeUpper(cardData.video_origem, 'PACOTE BÁSICO'))}</span>
                    </div>
                </div>
            </div>`;
    }
}
