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

export class ThumbModel extends CardModel {
    static id   = 'v4-thumb';
    static name = 'FullArt';

    static getHtmlStructure() {
        return `
            <div class="card v4-thumb" id="card-preview" style="--c-base: #7B2FBE;">
                <img class="card-photo-bg" src="" alt="" style="display:none;" draggable="false" />
                <div class="card-photo-placeholder-bg"></div>
                <div class="card-gradient-overlay"></div>
                
                <div class="card-content">
                    <div class="thumb-header">
                        <span class="card-title-text">SEM TÍTULO</span>
                        <div class="thumb-tag">
                            <span class="card-tipo-badge">PERSONAGEM</span>
                        </div>
                    </div>
                    
                    <div class="card-spacer"></div>
                    
                    <div class="thumb-footer">
                        <div class="thumb-attributes">
                            ${ATTR_KEYS.map(({ label }) => `
                                <div class="thumb-attr">
                                    <span class="attr-val">5</span>
                                    <span class="attr-lab">${label}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="thumb-bottom-row">
                            <span class="card-phrase-text">"..."</span>
                            <div class="card-pacote">PACOTE BÁSICO</div>
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
            if (photoBg) { 
                photoBg.src = cardData.foto; 
                photoBg.style.display = 'block'; 
                const zoom = cardData.zoom || 1;
                const px   = cardData.pos_x || 0;
                const py   = cardData.pos_y || 0;
                photoBg.style.transform = `translate(${px}px, ${py}px) scale(${zoom})`;
            }
            if (placeholderBg) placeholderBg.style.display = 'none';
        } else {
            if (photoBg) photoBg.style.display = 'none';
            if (placeholderBg) placeholderBg.style.display = 'block';
        }

        const attrValues = card.querySelectorAll('.thumb-attr .attr-val');
        ATTR_KEYS.forEach(({ key }, i) => {
            if (attrValues[i]) attrValues[i].textContent = `${cardData.atributos?.[key] ?? 5}/10`;
        });
    }

    static toHTML(cardData) {
        const photoHTML = cardData.foto 
            ? `<img class="card-photo-bg" src="${esc(cardData.foto)}" alt="" style="transform: translate(${cardData.pos_x || 0}px, ${cardData.pos_y || 0}px) scale(${cardData.zoom || 1});" draggable="false" />` 
            : `<div class="card-photo-placeholder-bg"></div>`;

        const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
            <div class="thumb-attr">
                <span class="attr-val">${cardData.atributos?.[key] ?? 5}/10</span>
                <span class="attr-lab">${label}</span>
            </div>`).join('');

        return `
            <div class="card v4-thumb" data-card-id="${esc(cardData.id)}" style="${colorVars(cardData.cor || '#7B2FBE')}">
                ${photoHTML}
                <div class="card-gradient-overlay"></div>
                
                <div class="card-content">
                    <div class="thumb-header">
                        <span class="card-title-text">${esc(cardData.titulo?.toUpperCase() || 'SEM TÍTULO')}</span>
                        <div class="thumb-tag">
                            <span class="card-tipo-badge">${esc((cardData.tipo || 'PERSONAGEM').toUpperCase())}</span>
                        </div>
                    </div>
                    
                    <div class="card-spacer"></div>
                    
                    <div class="thumb-footer">
                        <div class="thumb-attributes">
                            ${attrRowsHTML}
                        </div>
                        <div class="thumb-bottom-row">
                            <span class="card-phrase-text">${esc(cardData.frase || '"..."')}</span>
                            <div class="card-pacote">${esc((cardData.video_origem || 'PACOTE BÁSICO').toUpperCase())}</div>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}
