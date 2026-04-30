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

export class FullArtModel extends CardModel {
    static id   = 'v3-full-art';
    static name = 'Full Art (v3)';

    static getHtmlStructure() {
        return `
            <div class="card v3-full-art" id="card-preview" style="--c-base: #7B2FBE;">
                <img class="card-photo-bg" src="" alt="" style="display:none;" />
                <div class="card-photo-placeholder-bg"></div>
                <div class="card-oval-vignette"></div>
                <div class="card-oval-frame"></div>
                
                <div class="card-content">
                    <div class="card-top-bar">
                        <span class="card-title-text">SEM TÍTULO</span>
                        <span class="card-tipo-badge">PERSONAGEM</span>
                    </div>
                    
                    <div class="card-spacer"></div>
                    
                    <div class="card-bottom-bar">
                        ${ATTR_KEYS.map(({ label }) => `
                            <div class="attr-compact">
                                <span class="attr-label-short">${label}</span>
                                <span class="attr-value">5/10</span>
                            </div>
                        `).join('')}
                        <div class="v3-footer">
                            <span class="card-pacote">PACOTE BÁSICO</span>
                            <span class="card-phrase-text">"..."</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    static update(cardData, previewId = 'card-preview') {
        const card = document.getElementById(previewId);
        if (!card) return;

        card.style.cssText = colorVars(cardData.cor || '#7B2FBE');

        if (card.querySelector('.card-title-text')) card.querySelector('.card-title-text').textContent = cardData.titulo ? cardData.titulo.toUpperCase() : 'SEM TÍTULO';
        if (card.querySelector('.card-tipo-badge')) card.querySelector('.card-tipo-badge').textContent = (cardData.tipo || 'PERSONAGEM').toUpperCase();
        if (card.querySelector('.card-phrase-text')) card.querySelector('.card-phrase-text').textContent = cardData.frase || '"..."';
        if (card.querySelector('.card-pacote')) card.querySelector('.card-pacote').textContent = (cardData.video_origem || 'PACOTE BÁSICO').toUpperCase();

        const photoBg = card.querySelector('.card-photo-bg');
        const placeholderBg = card.querySelector('.card-photo-placeholder-bg');
        if (cardData.foto) {
            if (photoBg) { photoBg.src = cardData.foto; photoBg.style.display = 'block'; }
            if (placeholderBg) placeholderBg.style.display = 'none';
        } else {
            if (photoBg) photoBg.style.display = 'none';
            if (placeholderBg) placeholderBg.style.display = 'block';
        }

        const attrValues = card.querySelectorAll('.card-bottom-bar .attr-value');
        ATTR_KEYS.forEach(({ key }, i) => {
            if (attrValues[i]) attrValues[i].textContent = `${cardData.atributos?.[key] ?? 5}/10`;
        });
    }

    static toHTML(cardData) {
        const photoHTML = cardData.foto 
            ? `<img class="card-photo-bg" src="${esc(cardData.foto)}" alt="" />` 
            : `<div class="card-photo-placeholder-bg"></div>`;

        const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
            <div class="attr-compact">
                <span class="attr-label-short">${label}</span>
                <span class="attr-value">${cardData.atributos?.[key] ?? 5}/10</span>
            </div>`).join('');

        return `
            <div class="card v3-full-art" data-card-id="${esc(cardData.id)}" style="${colorVars(cardData.cor || '#7B2FBE')}">
                ${photoHTML}
                <div class="card-oval-vignette"></div>
                <div class="card-oval-frame"></div>
                
                <div class="card-content">
                    <div class="card-top-bar">
                        <span class="card-title-text">${esc(cardData.titulo?.toUpperCase() || 'SEM TÍTULO')}</span>
                        <span class="card-tipo-badge">${esc((cardData.tipo || 'PERSONAGEM').toUpperCase())}</span>
                    </div>
                    
                    <div class="card-spacer"></div>
                    
                    <div class="card-bottom-bar">
                        ${attrRowsHTML}
                        <div class="v3-footer">
                            <span class="card-pacote">${esc((cardData.video_origem || 'PACOTE BÁSICO').toUpperCase())}</span>
                            <span class="card-phrase-text">${esc(cardData.frase || '"..."')}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}
