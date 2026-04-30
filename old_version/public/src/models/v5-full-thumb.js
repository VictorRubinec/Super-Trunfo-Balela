import { CardModel } from './card-model.js';
import { colorVars } from '../utils/color-utils.js';

const ATTR_KEYS = [
    { key: 'entretenimento',  label: 'ENT' },
    { key: 'vergonha_alheia', label: 'VGH' },
    { key: 'competencia',     label: 'CMP' },
    { key: 'balela',          label: 'BAL' },
    { key: 'climao',          label: 'CLM' },
];

function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class FullThumbModel extends CardModel {
    static id   = 'v5-full-thumb';
    static name = 'Thumb Sem Borda (v5)';

    static getHtmlStructure() {
        return `
            <div class="card v5-full-thumb" id="card-preview" style="--c-base: #7B2FBE;">
                <img class="card-photo-bg" src="" alt="" style="display:none;" />
                <div class="card-photo-placeholder-bg"></div>
                <div class="v5-overlay"></div>
                
                <div class="card-inner">
                    <div class="v5-title-banner">
                        <span class="card-title-text">SEM TÍTULO</span>
                    </div>

                    <div class="card-spacer"></div>

                    <div class="v5-badge-row">
                        <span class="card-tipo-badge">PERSONAGEM</span>
                    </div>

                    <div class="v5-attributes-box">
                        ${ATTR_KEYS.map(({ label }) => `
                            <div class="v5-attr-row">
                                <span class="v5-label">${label}</span>
                                <span class="v5-value">5/10</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="v5-phrase-banner">
                        <span class="card-phrase-text">"..."</span>
                    </div>

                    <div class="v5-footer-info">
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

        const photoBg = card.querySelector('.card-photo-bg');
        const placeholderBg = card.querySelector('.card-photo-placeholder-bg');
        if (cardData.foto) {
            if (photoBg) { photoBg.src = cardData.foto; photoBg.style.display = 'block'; }
            if (placeholderBg) placeholderBg.style.display = 'none';
        } else {
            if (photoBg) photoBg.style.display = 'none';
            if (placeholderBg) placeholderBg.style.display = 'block';
        }

        const attrValues = card.querySelectorAll('.v5-attr-row .v5-value');
        ATTR_KEYS.forEach(({ key }, i) => {
            if (attrValues[i]) attrValues[i].textContent = `${cardData.atributos?.[key] ?? 5}/10`;
        });
    }

    static toHTML(cardData) {
        const photoHTML = cardData.foto 
            ? `<img class="card-photo-bg" src="${esc(cardData.foto)}" alt="" />` 
            : `<div class="card-photo-placeholder-bg"></div>`;

        const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
            <div class="v5-attr-row">
                <span class="v5-label">${label}</span>
                <span class="v5-value">${cardData.atributos?.[key] ?? 5}/10</span>
            </div>`).join('');

        const safeUpper = (val, fallback) => (val ? val.toString().toUpperCase() : fallback);

        return `
            <div class="card v5-full-thumb" data-card-id="${esc(cardData.id)}" style="${colorVars(cardData.cor || '#7B2FBE')}">
                ${photoHTML}
                <div class="v5-overlay"></div>
                <div class="card-inner">
                    <div class="v5-title-banner">
                        <span class="card-title-text">${esc(safeUpper(cardData.titulo, 'SEM TÍTULO'))}</span>
                    </div>

                    <div class="card-spacer"></div>

                    <div class="v5-badge-row">
                        <span class="card-tipo-badge">${esc(safeUpper(cardData.tipo, 'PERSONAGEM'))}</span>
                    </div>

                    <div class="v5-attributes-box">
                        ${attrRowsHTML}
                    </div>

                    <div class="v5-phrase-banner">
                        <span class="card-phrase-text">${esc(cardData.frase || '"..."')}</span>
                    </div>

                    <div class="v5-footer-info">
                        <span class="card-pacote">${esc(safeUpper(cardData.video_origem, 'PACOTE BÁSICO'))}</span>
                    </div>
                </div>
            </div>`;
    }
}
