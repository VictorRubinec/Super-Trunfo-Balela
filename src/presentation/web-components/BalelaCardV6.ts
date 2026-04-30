import { getColorVars } from './utils';

class BalelaCardV6 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['titulo', 'tipo', 'frase', 'cor', 'foto', 'entretenimento', 'vergonha_alheia', 'competencia', 'balela', 'climao', 'zoom', 'pos_x', 'pos_y'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    
    if (['zoom', 'pos_x', 'pos_y'].includes(name)) {
      this.updateImageTransform();
    } else {
      this.render();
    }
  }

  updateImageTransform() {
    const img = this.shadowRoot?.querySelector('.card-photo') as HTMLElement;
    if (img) {
      const zoom = this.getAttribute('zoom') || '1';
      const posX = this.getAttribute('pos_x') || '0';
      const posY = this.getAttribute('pos_y') || '0';
      img.style.transform = `translate(${posX}px, ${posY}px) scale(${zoom})`;
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const titulo = (this.getAttribute('titulo') || 'SEM TÍTULO').toUpperCase();
    const tipo = (this.getAttribute('tipo') || 'PERSONAGEM').toUpperCase();
    const frase = this.getAttribute('frase') || '"..."';
    const cor = this.getAttribute('cor') || '#7B2FBE';
    const foto = this.getAttribute('foto') || '';
    const zoom = this.getAttribute('zoom') || '1';
    const posX = this.getAttribute('pos_x') || '0';
    const posY = this.getAttribute('pos_y') || '0';
    
    const attrs = {
      entretenimento: this.getAttribute('entretenimento') || '5',
      vergonha_alheia: this.getAttribute('vergonha_alheia') || '5',
      competencia: this.getAttribute('competencia') || '5',
      balela: this.getAttribute('balela') || '5',
      climao: this.getAttribute('climao') || '5',
    };

    const colorVars = getColorVars(cor);

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 252px;
            height: 352px;
            font-family: var(--font-outfit), 'Outfit', sans-serif;
            ${colorVars}
            box-sizing: border-box;
          }
          * { box-sizing: border-box; }
          .card {
            width: 252px;
            height: 352px;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            background: linear-gradient(165deg, var(--c-dark) 0%, var(--c-darker) 100%);
            /* box-shadow removido */
            user-select: none;
            -webkit-user-drag: none;
          }
          .card-inner {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            padding: 12px 0 10px 0;
            gap: 8px;
          }
          .v6-title-banner {
            margin: 0 12px -16px;
            background: var(--c-base);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            padding: 5px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            position: relative;
            z-index: 10;
          }
          .card-title-text {
            display: block;
            font-weight: 900;
            font-size: 11.5px;
            color: var(--c-contrast);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: center;
          }
          .v6-photo-container {
            width: 100%;
            aspect-ratio: 1280 / 720;
            background: #000;
            position: relative;
            overflow: hidden;
            border-top: 2px solid var(--c-base);
            border-bottom: 2px solid var(--c-base);
          }
          .card-photo {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
          .v6-badge-row {
            display: flex;
            justify-content: center;
            margin-top: -16px;
            margin-bottom: 2px;
            position: relative;
            z-index: 10;
          }
          .card-tipo-badge {
            background: var(--c-base);
            border: 1.5px solid var(--c-contrast);
            border-radius: 4px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 10px;
            font-size: 8px;
            font-weight: 800;
            color: var(--c-contrast);
            text-transform: uppercase;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          }
          .v6-attributes {
            flex: 1;
            margin: 0 12px;
            background: rgba(0, 0, 0, 0.90);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .attr-row {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .attr-row:last-child { border-bottom: none; }
          .attr-label {
            font-size: 7.5px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
          }
          .attr-value {
            font-size: 9.5px;
            font-weight: 900;
            color: var(--c-lighter);
          }
          .v6-phrase-banner {
            margin: -4px 12px -2px;
            background: #05000e;
            border-radius: 12px;
            padding: 4px;
            text-align: center;
          }
          .card-phrase-text {
            font-size: 9px;
            font-weight: 600;
            font-style: italic;
            color: #fff;
            opacity: 0.9;
          }
          .v6-footer {
            padding: 0 12px 2px;
          }
          .card-pacote {
            font-size: 6px;
            font-weight: 700;
            color: var(--c-light);
            opacity: 0.6;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        </style>
        <div class="card">
          <div class="card-inner">
            <div class="v6-title-banner">
              <span class="card-title-text">${titulo}</span>
            </div>
            <div class="v6-photo-container">
              ${foto ? `<img src="${foto}" class="card-photo" draggable="false" style="transform: translate(${posX}px, ${posY}px) scale(${zoom}); pointer-events: none;" />` : ''}
            </div>
            <div class="v6-badge-row">
              <div class="card-tipo-badge">${tipo}</div>
            </div>
            <div class="v6-attributes">
              <div class="attr-row"><span class="attr-label">ENTRETENIMENTO</span><span class="attr-value">${attrs.entretenimento}/10</span></div>
              <div class="attr-row"><span class="attr-label">VERGONHA ALHEIA</span><span class="attr-value">${attrs.vergonha_alheia}/10</span></div>
              <div class="attr-row"><span class="attr-label">COMPETÊNCIA</span><span class="attr-value">${attrs.competencia}/10</span></div>
              <div class="attr-row"><span class="attr-label">BALELA</span><span class="attr-value">${attrs.balela}/10</span></div>
              <div class="attr-row"><span class="attr-label">CLIMÃO</span><span class="attr-value">${attrs.climao}/10</span></div>
            </div>
            <div class="v6-phrase-banner">
              <span class="card-phrase-text">${frase}</span>
            </div>
            <div class="v6-footer">
              <div class="card-pacote">PACOTE BÁSICO</div>
            </div>
          </div>
        </div>
      `;
    }
  }
}

if (!customElements.get('balela-card-v6')) {
  customElements.define('balela-card-v6', BalelaCardV6);
}

export default BalelaCardV6;
