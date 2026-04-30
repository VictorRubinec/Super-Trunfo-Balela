import { getColorVars } from './utils';

class BalelaCardV1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['titulo', 'tipo', 'frase', 'cor', 'foto', 'entretenimento', 'vergonha_alheia', 'competencia', 'balela', 'climao', 'zoom', 'pos_x', 'pos_y'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    
    // Otimização: Se apenas posição ou zoom mudarem, não re-renderiza o HTML todo
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
            overflow: hidden;
          }
          * { box-sizing: border-box; }
          .card {
            width: 252px;
            height: 352px;
            border-radius: 14px;
            position: relative;
            overflow: hidden;
            border: 9px solid var(--c-base);
            box-shadow: inset 0 0 0 2px var(--c-darker);
            background: linear-gradient(168deg, var(--c-dark) 0%, var(--c-darker) 100%);
            user-select: none;
            -webkit-user-drag: none;
          }
          .card-inner {
            position: absolute;
            inset: 10px;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .card-title-banner {
            background: var(--c-base);
            border-radius: 6px;
            padding: 5px 10px;
            flex-shrink: 0;
          }
          .card-title-text {
            display: block;
            font-weight: 900;
            font-size: 13px;
            line-height: 1;
            color: var(--c-contrast);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            text-shadow: var(--c-shadow-title);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .card-photo-frame {
            flex: 1.4;
            border-radius: 6px;
            overflow: hidden;
            border: 2px solid var(--c-dark);
            background: #06010e;
            margin-bottom: -16px;
            position: relative;
            z-index: 1;
          }
          .card-photo {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
          .card-tipo-badge {
            display: flex;
            width: 90%;
            margin-left: 5%;
            position: relative;
            z-index: 2;
          }
          .card-tipo-text {
            background: var(--c-darker);
            border: 1.2px solid var(--c-base);
            border-radius: 4px;
            width: 100%;
            text-align: center;
            padding: 3px 8px;
            font-weight: 800;
            font-size: 8.5px;
            color: var(--c-contrast);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          }
          .card-attributes {
            background: var(--c-darker);
            border: 1px solid var(--c-darker);
            border-radius: 6px;
            overflow: hidden;
            flex-shrink: 0;
          }
          .attr-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3.5px 8px;
            border-bottom: 1px solid var(--c-darker);
          }
          .attr-row:last-child { border-bottom: none; }
          .attr-label {
            font-weight: 700;
            font-size: 8px;
            color: rgba(255, 255, 255, 0.8);
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .attr-value {
            font-weight: 800;
            font-size: 10px;
            color: var(--c-lighter);
          }
          .card-phrase-banner {
            background: var(--c-darker);
            border: 1px solid var(--c-dark);
            border-radius: 16px;
            padding: 5px 12px;
            text-align: center;
            flex-shrink: 0;
          }
          .card-phrase-text {
            font-weight: 600;
            font-size: 9px;
            color: rgba(255, 255, 255, 0.88);
            font-style: italic;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .card-pacote {
            font-size: 6.5px;
            font-weight: 500;
            color: var(--c-light);
            opacity: 0.6;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 2px 4px;
          }
        </style>
        <div class="card">
          <div class="card-inner">
            <div class="card-title-banner">
              <span class="card-title-text">${titulo}</span>
            </div>
            <div class="card-photo-frame">
              ${foto ? `<img src="${foto}" class="card-photo" draggable="false" style="transform: translate(${posX}px, ${posY}px) scale(${zoom}); pointer-events: none;" />` : ''}
            </div>
            <div class="card-tipo-badge">
              <span class="card-tipo-text">${tipo}</span>
            </div>
            <div class="card-attributes">
              <div class="attr-row"><span class="attr-label">ENTRETENIMENTO:</span><span class="attr-value">${attrs.entretenimento}/10</span></div>
              <div class="attr-row"><span class="attr-label">VERGONHA ALHEIA:</span><span class="attr-value">${attrs.vergonha_alheia}/10</span></div>
              <div class="attr-row"><span class="attr-label">COMPETÊNCIA:</span><span class="attr-value">${attrs.competencia}/10</span></div>
              <div class="attr-row"><span class="attr-label">BALELA:</span><span class="attr-value">${attrs.balela}/10</span></div>
              <div class="attr-row"><span class="attr-label">CLIMÃO:</span><span class="attr-value">${attrs.climao}/10</span></div>
            </div>
            <div class="card-phrase-banner">
              <span class="card-phrase-text">${frase}</span>
            </div>
            <div class="card-pacote">PACOTE BÁSICO</div>
          </div>
        </div>
      `;
    }
  }
}

if (!customElements.get('balela-card-v1')) {
  customElements.define('balela-card-v1', BalelaCardV1);
}

export default BalelaCardV1;
