class BalelaCardBack extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 252px;
            height: 352px;
            box-sizing: border-box;
          }
          * { box-sizing: border-box; }
          .card-back {
            width: 252px;
            height: 352px;
            background: #0f0426;
            border-radius: 14px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 9px solid #1a0a3a;
            /* box-shadow removido */
            user-select: none;
          }
          /* Padrão geométrico de fundo */
          .card-back::before {
            content: '';
            position: absolute;
            inset: 10px;
            border-radius: 8px;
            background-image: 
              linear-gradient(30deg, rgba(123, 47, 190, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(123, 47, 190, 0.05) 87.5%, rgba(123, 47, 190, 0.05)),
              linear-gradient(150deg, rgba(123, 47, 190, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(123, 47, 190, 0.05) 87.5%, rgba(123, 47, 190, 0.05)),
              linear-gradient(30deg, rgba(123, 47, 190, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(123, 47, 190, 0.05) 87.5%, rgba(123, 47, 190, 0.05)),
              linear-gradient(150deg, rgba(123, 47, 190, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(123, 47, 190, 0.05) 87.5%, rgba(123, 47, 190, 0.05)),
              linear-gradient(60deg, rgba(168, 85, 247, 0.03) 25%, transparent 25.5%, transparent 75%, rgba(168, 85, 247, 0.03) 75.5%, rgba(168, 85, 247, 0.03)),
              linear-gradient(60deg, rgba(168, 85, 247, 0.03) 25%, transparent 25.5%, transparent 75%, rgba(168, 85, 247, 0.03) 75.5%, rgba(168, 85, 247, 0.03));
            background-size: 40px 70px;
            background-position: 0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px;
            z-index: 1;
          }
          /* Moldura interna neon */
          .card-back::after {
            content: '';
            position: absolute;
            inset: 10px;
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: 8px;
            pointer-events: none;
            z-index: 2;
            box-shadow: inset 0 0 15px rgba(123, 47, 190, 0.2);
          }
          .back-content {
            position: relative;
            z-index: 3;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
          }
          .back-logo-main {
            width: 180px;
            height: auto;
            filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.6));
            animation: float 4s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        </style>
        <div class="card-back">
          <div class="back-content">
            <img src="/assets/logo/logo-carta.png" class="back-logo-main" alt="Balela Logo" />
          </div>
        </div>
      `;
    }
  }
}

if (!customElements.get('balela-card-back')) {
  customElements.define('balela-card-back', BalelaCardBack);
}

export default BalelaCardBack;
