function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function colorVars(hex) {
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) hex = '#7B2FBE';
    const { h, s, l } = hexToHsl(hex);
    
    // Luminosidade para contraste
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isLight = luminance > 0.75;
    const contrast = isLight ? '#000000' : '#ffffff';
    const titleShadow = isLight ? '#000000' : hslToHex(h, Math.min(s + 10, 100), Math.max(l - 34, 3));

    const dark    = hslToHex(h, Math.min(s + 5,  100), Math.max(l - 18, 6));
    const darker  = hslToHex(h, Math.min(s + 10, 100), Math.max(l - 34, 3));
    const light   = hslToHex(h, Math.max(s - 8,  0),   Math.min(l + 18, 92));
    const lighter = hslToHex(h, Math.max(s - 18, 0),   Math.min(l + 32, 96));
    
    return `--c-base:${hex};--c-dark:${dark};--c-darker:${darker};--c-light:${light};--c-lighter:${lighter};--c-contrast:${contrast};--c-shadow-title:${titleShadow};`;
}

function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ATTR_KEYS = [
    { key: 'entretenimento',  label: 'ENT' },
    { key: 'vergonha_alheia', label: 'VGH' },
    { key: 'competencia',     label: 'CMP' },
    { key: 'balela',          label: 'BAL' },
    { key: 'climao',          label: 'CLM' },
];
const ATTR_KEYS_FULL = [
    { key: 'entretenimento',  label: 'ENTRETENIMENTO:' },
    { key: 'vergonha_alheia', label: 'VERGONHA ALHEIA:' },
    { key: 'competencia',     label: 'COMPETÊNCIA:' },
    { key: 'balela',          label: 'BALELA:' },
    { key: 'climao',          label: 'CLIMÃO:' },
];

function renderV1(card, base) {
    const photoHTML = card.foto
        ? `<img class="card-photo" src="${base}${card.foto}" alt="" style="transform: translate(${card.pos_x || 0}px, ${card.pos_y || 0}px) scale(${card.zoom || 1});" />`
        : `<div class="card-photo-placeholder"><svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/><path d="M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg><span>Sem foto</span></div>`;

    const attrRowsHTML = ATTR_KEYS_FULL.map(({ key, label }) => `
        <div class="attr-row">
            <span class="attr-label">${label}</span>
            <span class="attr-value">${card.atributos?.[key] ?? 5}/10</span>
        </div>`).join('');

    return `
        <div class="card v1-default" style="${colorVars(card.cor)}">
            <div class="card-inner">
                <div class="card-title-banner"><span class="card-title-text">${esc(card.titulo?.toUpperCase() || 'SEM TÍTULO')}</span></div>
                <div class="card-photo-frame">${photoHTML}</div>
                <div class="card-tipo-badge"><span class="card-tipo-text">${esc((card.tipo || 'PERSONAGEM').toUpperCase())}</span></div>
                <div class="card-attributes">${attrRowsHTML}</div>
                <div class="card-phrase-banner"><span class="card-phrase-text">${esc(card.frase || '"..."')}</span></div>
                <div class="card-pacote">${esc((card.video_origem || 'PACOTE BÁSICO').toUpperCase())}</div>
            </div>
        </div>`;
}

function renderV2(card, base) {
    const photoHTML = card.foto ? `<img class="card-photo-bg" src="${base}${card.foto}" alt="" style="transform: translate(${card.pos_x || 0}px, ${card.pos_y || 0}px) scale(${card.zoom || 1});" />` : '';
    const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
        <div class="attr-row">
            <span class="attr-label">${label}</span>
            <span class="attr-value">${card.atributos?.[key] ?? 5}</span>
        </div>`).join('');

    return `
        <div class="card v2-especial" style="${colorVars(card.cor)}">
            ${photoHTML}
            <div class="card-top-overlay">
                <span class="card-title-text">${esc(card.titulo?.toUpperCase() || 'SEM TÍTULO')}</span>
                <span class="card-tipo-badge">${esc((card.tipo || 'PERSONAGEM').toUpperCase())}</span>
            </div>
            <div class="card-bottom-overlay">
                <div class="card-attributes">${attrRowsHTML}</div>
                <span class="card-phrase-text">${esc(card.frase || '"..."')}</span>
                <div class="card-pacote">${esc((card.video_origem || 'PACOTE BÁSICO').toUpperCase())}</div>
            </div>
        </div>`;
}

function renderV3(card, base) {
    const photoHTML = card.foto 
        ? `<img class="card-photo-bg" src="${base}${card.foto}" alt="" style="transform: translate(${card.pos_x || 0}px, ${card.pos_y || 0}px) scale(${card.zoom || 1});" />` 
        : `<div class="card-photo-placeholder-bg"></div>`;
    const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
        <div class="attr-compact">
            <span class="attr-label-short">${label}</span>
            <span class="attr-value">${card.atributos?.[key] ?? 5}</span>
        </div>`).join('');

    return `
        <div class="card v3-full-art" style="${colorVars(card.cor)}">
            ${photoHTML}
            <div class="card-oval-vignette"></div>
            <div class="card-oval-frame"></div>
            <div class="card-content">
                <div class="card-top-bar">
                    <span class="card-title-text">${esc(card.titulo?.toUpperCase() || 'SEM TÍTULO')}</span>
                    <span class="card-tipo-badge">${esc((card.tipo || 'PERSONAGEM').toUpperCase())}</span>
                </div>
                <div class="card-spacer"></div>
                <div class="card-bottom-bar">
                    ${attrRowsHTML}
                    <span class="card-phrase-text">${esc(card.frase || '"..."')}</span>
                    <div class="card-pacote">${esc((card.video_origem || 'PACOTE BÁSICO').toUpperCase())}</div>
                </div>
            </div>
        </div>`;
}

function renderV4(card, base) {
    const photoHTML = card.foto 
        ? `<img class="card-photo-bg" src="${base}${card.foto}" alt="" style="transform: translate(${card.pos_x || 0}px, ${card.pos_y || 0}px) scale(${card.zoom || 1});" />` 
        : `<div class="card-photo-placeholder-bg"></div>`;
    const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
        <div class="thumb-attr">
            <span class="attr-val">${card.atributos?.[key] ?? 5}/10</span>
            <span class="attr-lab">${label}</span>
        </div>`).join('');

    return `
        <div class="card v4-thumb" style="${colorVars(card.cor)}">
            ${photoHTML}
            <div class="card-gradient-overlay"></div>
            <div class="card-content">
                <div class="thumb-header">
                    <span class="card-title-text">${esc(card.titulo?.toUpperCase() || 'SEM TÍTULO')}</span>
                    <div class="thumb-tag"><span class="card-tipo-badge">${esc((card.tipo || 'PERSONAGEM').toUpperCase())}</span></div>
                </div>
                <div class="card-spacer"></div>
                <div class="thumb-footer">
                    <div class="thumb-attributes">${attrRowsHTML}</div>
                    <div class="thumb-bottom-row">
                        <span class="card-phrase-text">${esc(card.frase || '"..."')}</span>
                        <div class="card-pacote">${esc((card.video_origem || 'PACOTE BÁSICO').toUpperCase())}</div>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderV5(card, base) {
    const photoHTML = card.foto 
        ? `<img class="card-photo-bg" src="${base}${card.foto}" alt="" />` 
        : `<div class="card-photo-placeholder-bg"></div>`;
    const attrRowsHTML = ATTR_KEYS.map(({ key, label }) => `
        <div class="v5-attr-row">
            <span class="v5-label">${label}</span>
            <span class="v5-value">${card.atributos?.[key] ?? 5}/10</span>
        </div>`).join('');

    return `
        <div class="card v5-full-thumb" style="${colorVars(card.cor)}">
            ${photoHTML}
            <div class="v5-overlay"></div>
            <div class="card-inner">
                <div class="v5-title-banner"><span class="card-title-text">${esc(card.titulo?.toUpperCase() || 'SEM TÍTULO')}</span></div>
                <div class="card-spacer"></div>
                <div class="v5-badge-row"><span class="card-tipo-badge">${esc((card.tipo || 'PERSONAGEM').toUpperCase())}</span></div>
                <div class="v5-attributes-box">${attrRowsHTML}</div>
                <div class="v5-phrase-banner"><span class="card-phrase-text">${esc(card.frase || '"..."')}</span></div>
                <div class="v5-footer-info"><span class="card-pacote">${esc((card.video_origem || 'PACOTE BÁSICO').toUpperCase())}</span></div>
            </div>
        </div>`;
}

function renderV6(card, base) {
    const photoHTML = card.foto 
        ? `<img class="card-photo" src="${base}${card.foto}" alt="" style="transform: translate(${card.pos_x || 0}px, ${card.pos_y || 0}px) scale(${card.zoom || 1});" />` 
        : `<div class="card-photo-placeholder"><span>16:9 ART</span></div>`;
    const attrRowsHTML = ATTR_KEYS_FULL.map(({ key, label }) => `
        <div class="attr-row">
            <span class="attr-label">${label}</span>
            <span class="attr-value">${card.atributos?.[key] ?? 5}/10</span>
        </div>`).join('');

    return `
        <div class="card v6-showcase" style="${colorVars(card.cor)}">
            <div class="card-inner">
                <div class="v6-title-banner"><span class="card-title-text">${esc(card.titulo?.toUpperCase() || 'SEM TÍTULO')}</span></div>
                <div class="v6-photo-container">${photoHTML}</div>
                <div class="v6-badge-row"><span class="card-tipo-badge">${esc((card.tipo || 'PERSONAGEM').toUpperCase())}</span></div>
                <div class="v6-attributes">${attrRowsHTML}</div>
                <div class="v6-phrase-banner"><span class="card-phrase-text">${esc(card.frase || '"..."')}</span></div>
                <div class="v6-footer"><span class="card-pacote">${esc((card.video_origem || 'PACOTE BÁSICO').toUpperCase())}</span></div>
            </div>
        </div>`;
}

function cardToHtml(card, port) {
    const base = `http://localhost:${port}`;
    if (card.modelo === 'v2-especial')   return renderV2(card, base);
    if (card.modelo === 'v3-full-art')   return renderV3(card, base);
    if (card.modelo === 'v4-thumb')      return renderV4(card, base);
    if (card.modelo === 'v5-full-thumb') return renderV5(card, base);
    if (card.modelo === 'v6-showcase')   return renderV6(card, base);
    return renderV1(card, base); // v1
}

module.exports = { cardToHtml, colorVars };
