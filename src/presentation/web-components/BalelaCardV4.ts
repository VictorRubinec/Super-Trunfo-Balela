import { getColorVars } from './utils';

class BalelaCardV4 extends HTMLElement {
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
    const img = this.shadowRoot?.querySelector('.card-photo-bg') as HTMLElement;
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
            border: 1px solid rgba(255, 255, 255, 0.15);
            /* box-shadow removido */
            background: #000;
            user-select: none;
            -webkit-user-drag: none;
          }
          .card-photo-bg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 0;
          }
          .card-gradient-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.5) 100%);
          }
          .card-content {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: flex;
            flex-direction: column;
            padding: 12px;
          }
          .thumb-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          .card-title-text {
            font-weight: 900;
            font-size: 18px;
            color: var(--c-contrast);
            text-transform: uppercase;
            line-height: 1.1;
            letter-spacing: -0.02em;
            text-shadow: 2px 2px 0px var(--c-shadow-title), 4px 4px 15px rgba(0, 0, 0, 0.8);
          }
          .thumb-tag {
            background: var(--c-base);
            padding: 4px 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
            margin-top: -10px; /* Sobe o badge */
          }
          .card-tipo-badge {
            font-size: 8px;
            font-weight: 800;
            color: var(--c-contrast);
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .card-spacer { flex: 1; }
          .thumb-footer {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .thumb-attributes {
            display: flex;
            justify-content: space-between;
            background: rgba(0, 0, 0, 0.90);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 6px 4px;
          }
          .thumb-attr {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .attr-val {
            font-weight: 900;
            font-size: 10px;
            color: var(--c-lighter);
            line-height: 1.2;
          }
          .attr-lab {
            font-size: 6px;
            font-weight: 700;
            color: var(--c-lighter);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .card-phrase-text {
            font-size: 8.5px;
            font-weight: 600;
            color: #fff;
            font-style: italic;
            text-align: center;
          }
          .card-pacote {
            font-size: 6px;
            font-weight: 700;
            color: var(--c-light);
            text-transform: uppercase;
            width: 100%;
            text-align: left;
            letter-spacing: 0.05em;
          }
        </style>
        <div class="card">
          ${foto ? `<img src="${foto}" class="card-photo-bg" draggable="false" style="transform: translate(${posX}px, ${posY}px) scale(${zoom}); pointer-events: none;" />` : '<div style="position:absolute;inset:0;background:#1a0a3a;z-index:0"></div>'}
          <div class="card-gradient-overlay"></div>
          <div class="card-content">
            <div class="thumb-header">
              <h2 class="card-title-text">${titulo}</h2>
              <div class="thumb-tag">
                <span class="card-tipo-badge">${tipo}</span>
              </div>
            </div>
            <div class="card-spacer"></div>
            <div class="thumb-footer">
              <div class="thumb-attributes">
                <div class="thumb-attr"><span class="attr-val">${attrs.entretenimento}</span><span class="attr-lab">ENT</span></div>
                <div class="thumb-attr"><span class="attr-val">${attrs.vergonha_alheia}</span><span class="attr-lab">ALH</span></div>
                <div class="thumb-attr"><span class="attr-val">${attrs.competencia}</span><span class="attr-lab">COM</span></div>
                <div class="thumb-attr"><span class="attr-val">${attrs.balela}</span><span class="attr-lab">BAL</span></div>
                <div class="thumb-attr"><span class="attr-val">${attrs.climao}</span><span class="attr-lab">CLI</span></div>
              </div>
              <div style="text-align:center">
                <div class="card-phrase-text">${frase}</div>
              </div>
              <div class="card-pacote">PACOTE BÁSICO</div>
            </div>
          </div>
        </div>
      `;
    }
  }
}

if (!customElements.get('balela-card-v4')) {
  customElements.define('balela-card-v4', BalelaCardV4);
}

export default BalelaCardV4;
