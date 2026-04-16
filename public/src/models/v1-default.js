import { CardModel } from './card-model.js';
import { colorVars } from '../utils/color-utils.js';

const PLACEHOLDER_HTML = `
    <div class="card-photo-placeholder">
        <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
            <path d="M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
        </svg>
        <span>Sem foto</span>
    </div>
`;

const ATTR_KEYS = [
    { key: 'entretenimento',  label: 'ENTRETENIMENTO:' },
    { key: 'vergonha_alheia', label: 'VERGONHA ALHEIA:' },
    { key: 'competencia',     label: 'COMPETÊNCIA:' },
    { key: 'balela',          label: 'BALELA:' },
    { key: 'climao',          label: 'CLIMÃO:' },
];

function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export class CristalModel extends CardModel {
    static id   = 'v1-default';
    static name = 'Comum (v1)';

    static getHtmlStructure() {
        return `
            <div class="card v1-default" id="card-preview" style="--c-base: #7B2FBE;">
                <div class="card-inner">
                    <div class="card-title-banner">
                        <span class="card-title-text">SEM TÍTULO</span>
                    </div>
                    <div class="card-photo-frame">
                        ${PLACEHOLDER_HTML}
                        <img class="card-photo" src="" alt="" style="display:none;" />
                    </div>
                    <div class="card-tipo-badge">
                        <span class="card-tipo-text">PERSONAGEM</span>
                    </div>
                    <div class="card-attributes">
                        ${ATTR_KEYS.map(({ label }) => `
                            <div class="attr-row">
                                <span class="attr-label">${label}</span>
                                <span class="attr-value">5/10</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="card-phrase-banner">
                        <span class="card-phrase-text">"..."</span>
                    </div>
                    <div class="card-pacote">PACOTE BÁSICO</div>
                </div>
            </div>`;
    }

    static update(cardData, previewId = 'card-preview') {
        const card = document.getElementById(previewId);
        if (!card) return;

        card.style.cssText = colorVars(cardData.cor || '#7B2FBE');

        const selectors = {
            title:  '.card-title-text',
            tipo:   '.card-tipo-text',
            phrase: '.card-phrase-text',
            pacote: '.card-pacote'
        };

        if (card.querySelector(selectors.title)) card.querySelector(selectors.title).textContent = cardData.titulo ? cardData.titulo.toUpperCase() : 'SEM TÍTULO';
        if (card.querySelector(selectors.tipo)) card.querySelector(selectors.tipo).textContent = (cardData.tipo || 'PERSONAGEM').toUpperCase();
        if (card.querySelector(selectors.phrase)) card.querySelector(selectors.phrase).textContent = cardData.frase || '"..."';
        // 'video_origem' agora serve como nome do pacote
        if (card.querySelector(selectors.pacote)) card.querySelector(selectors.pacote).textContent = (cardData.video_origem || 'PACOTE BÁSICO').toUpperCase();

        const photoEl       = card.querySelector('.card-photo');
        const placeholderEl = card.querySelector('.card-photo-placeholder');
        if (cardData.foto) {
            if (photoEl) { photoEl.src = cardData.foto; photoEl.style.display = 'block'; }
            if (placeholderEl) placeholderEl.style.display = 'none';
        } else {
            if (photoEl) photoEl.style.display = 'none';
            if (placeholderEl) placeholderEl.style.display = 'flex';
        }

        const attrValues = card.querySelectorAll('.card-attributes .attr-value');
        ATTR_KEYS.forEach(({ key }, i) => {
            if (attrValues[i]) attrValues[i].textContent = `${cardData.atributos?.[key] ?? 5}/10`;
        });
    }

    static toHTML(cardData) {
        const photoHTML = cardData.foto
            ? `<img class="card-photo" src="${esc(cardData.foto)}" alt="" />`
            : PLACEHOLDER_HTML;

        const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
            <div class="attr-row">
                <span class="attr-label">${label}</span>
                <span class="attr-value">${cardData.atributos?.[key] ?? 5}/10</span>
            </div>`).join('');

        return `
            <div class="card v1-default" data-card-id="${esc(cardData.id)}" style="${colorVars(cardData.cor || '#7B2FBE')}">
                <div class="card-inner">
                    <div class="card-title-banner">
                        <span class="card-title-text">${esc(cardData.titulo?.toUpperCase() || 'SEM TÍTULO')}</span>
                    </div>
                    <div class="card-photo-frame">
                        ${photoHTML}
                    </div>
                    <div class="card-tipo-badge">
                        <span class="card-tipo-text">${esc((cardData.tipo || 'PERSONAGEM').toUpperCase())}</span>
                    </div>
                    <div class="card-attributes">
                        ${attrRowsHTML}
                    </div>
                    <div class="card-phrase-banner">
                        <span class="card-phrase-text">${esc(cardData.frase || '"..."')}</span>
                    </div>
                    <div class="card-pacote">${esc((cardData.video_origem || 'PACOTE BÁSICO').toUpperCase())}</div>
                </div>
            </div>`;
    }
}
