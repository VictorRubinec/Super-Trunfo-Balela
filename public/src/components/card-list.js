import ModelRegistry from '../models/model-registry.js';
import ApiClient     from '../utils/api-client.js';
import PackageManager from './package-manager.js';
import AuthManager    from './auth-manager.js';
import Toast          from '../utils/toast.js';
import Confirm        from '../utils/confirm.js';

const CardList = {
    cards:  [],
    onEdit: null,   // callback: (cardData) => void
    el:     {},
    viewMode: 'grid', // 'grid' ou 'list'
    groupByPackage: false,

        async init() {
        this.el = {
            grid:         document.getElementById('gallery-grid'),
            empty:        document.getElementById('gallery-empty'),
            count:        document.getElementById('gallery-count'),
            btnGrid:      document.getElementById('btn-grid-view'),
            btnList:      document.getElementById('btn-list-view'),
            toggleGroup:  document.getElementById('toggle-group-package'),
        };

        this._bindEvents();
        await this._loadFromServer();
    },

    _bindEvents() {
        this.el.btnGrid?.addEventListener('click', () => {
            this.viewMode = 'grid';
            this.el.btnGrid.classList.add('active');
            this.el.btnList.classList.remove('active');
            this.el.grid.classList.remove('mode-list');
            this._render();
        });

        this.el.btnList?.addEventListener('click', () => {
            this.viewMode = 'list';
            this.el.btnList.classList.add('active');
            this.el.btnGrid.classList.remove('active');
            this.el.grid.classList.add('mode-list');
            this._render();
        });

        this.el.toggleGroup?.addEventListener('change', (e) => {
            this.groupByPackage = e.target.checked;
            this._render();
        });
    },

        async _loadFromServer() {
        try {
            this.cards = await ApiClient.getCards();
            this._render();
        } catch (err) {
            console.error('[CardList] Erro ao carregar cartas:', err);
        }
    },

        addCard(card) {
        this.cards.push(card);
        this._render();
    },

    replaceCard(updatedCard) {
        const idx = this.cards.findIndex(c => c.id === updatedCard.id);
        if (idx !== -1) this.cards[idx] = updatedCard;
        this._render();
    },

    removeCard(id) {
        this.cards = this.cards.filter(c => c.id !== id);
        this._render();
    },

    _render() {
        const { grid, empty, count } = this.el;
        if (!grid) return;

        if (count) {
            const n = this.cards.length;
            count.textContent = `${n} carta${n !== 1 ? 's' : ''}`;
        }

        grid.querySelectorAll('.gallery-item, .gallery-item-list, .package-group-header').forEach(el => el.remove());

        if (this.cards.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        let cardsToRender = [...this.cards];

        if (this.groupByPackage) {
            cardsToRender.sort((a, b) => (a.video_origem || '').localeCompare(b.video_origem || ''));
            
            let lastPkg = null;
            cardsToRender.forEach(card => {
                const currentPkg = card.video_origem || 'Sem Pacote';
                if (currentPkg !== lastPkg) {
                    this._renderGroupHeader(currentPkg);
                    lastPkg = currentPkg;
                }
                this._renderAppropriateItem(card);
            });
        } else {
            cardsToRender.forEach(card => this._renderAppropriateItem(card));
        }
    },

    _renderAppropriateItem(card) {
        if (this.viewMode === 'list') {
            this._renderListItem(card);
        } else {
            this._renderItem(card);
        }
    },

    _renderGroupHeader(name) {
        const header = document.createElement('div');
        header.className = 'package-group-header';
        const color = PackageManager.getColorForPackage(name) || '#ccc';
        
        header.innerHTML = `
            <div class="package-group-badge" style="background: ${color}"></div>
            <span class="package-group-title">${name}</span>
        `;
        this.el.grid.appendChild(header);
    },

    _renderItem(card) {
        const model = ModelRegistry.getById(card.modelo || 'v1-default');
        const item  = document.createElement('div');
        item.className    = 'gallery-item';
        item.dataset.id   = card.id;

        item.innerHTML = `
            ${model.toHTML(card)}
            <div class="gallery-item-info">
                <span class="gallery-item-title">${card.titulo || 'Sem título'}</span>
                <span class="gallery-item-tipo">${card.tipo || ''}</span>
            </div>
            <div class="gallery-item-actions">
                <button class="btn btn-secondary btn-edit" title="Editar">✏️ EDITAR</button>
                <button class="btn btn-danger btn-delete" title="Deletar">🗑️ DELETAR</button>
            </div>
        `;

        const isOwner = AuthManager.user && card.user_id === AuthManager.user.id;
        const isAdmin = AuthManager.isAdmin();
        
        if (!isOwner && !isAdmin) {
            item.querySelector('.gallery-item-actions').remove();
        } else {
            item.querySelector('.btn-edit').addEventListener('click', () => {
                this.onEdit?.(card);
            });

            item.querySelector('.btn-delete').addEventListener('click', async () => {
                const ok = await Confirm.show('Deletar Carta', `Tem certeza que deseja remover "${card.titulo}"?`, 'Deletar', 'Cancelar');
                if (!ok) return;
                try {
                    await ApiClient.deleteCard(card.id);
                    this.removeCard(card.id);
                    Toast.success('Carta removida com sucesso');
                } catch (err) {
                    Toast.error('Erro ao deletar: ' + err.message);
                }
            });
        }

        this.el.grid.appendChild(item);
    },

    _renderListItem(card) {
        const item = document.createElement('div');
        item.className = 'gallery-item-list';
        item.dataset.id = card.id;

        const a = card.atributos || {};
        
        item.innerHTML = `
            <div class="list-color-bar" style="background: ${card.cor || '#7B2FBE'}"></div>
            <div class="list-main-info">
                <span class="list-title">${card.titulo || 'Sem título'}</span>
                <span class="list-sub">${card.tipo || ''} ${card.video_origem ? '• ' + card.video_origem : ''}</span>
            </div>
            <div class="list-phrase">"${card.frase || ''}"</div>
            <div class="list-attributes">
                <div class="list-attr"><span class="list-attr-val">${a.entretenimento || 0}</span><span class="list-attr-sigla">ENT</span></div>
                <div class="list-attr"><span class="list-attr-val">${a.vergonha_alheia || 0}</span><span class="list-attr-sigla">VGH</span></div>
                <div class="list-attr"><span class="list-attr-val">${a.competencia || 0}</span><span class="list-attr-sigla">CMP</span></div>
                <div class="list-attr"><span class="list-attr-val">${a.balela || 0}</span><span class="list-attr-sigla">BAL</span></div>
                <div class="list-attr"><span class="list-attr-val">${a.climao || 0}</span><span class="list-attr-sigla">CLM</span></div>
            </div>
            <div class="gallery-item-actions">
                <button class="btn btn-secondary btn-edit" title="Editar">✏️ EDITAR</button>
                <button class="btn btn-danger btn-delete" title="Deletar">🗑️ DELETAR</button>
            </div>
        `;

        const isOwner = AuthManager.user && card.user_id === AuthManager.user.id;
        const isAdmin = AuthManager.isAdmin();

        if (!isOwner && !isAdmin) {
            item.querySelector('.gallery-item-actions').remove();
        } else {
            item.querySelector('.btn-edit').addEventListener('click', () => this.onEdit?.(card));
            item.querySelector('.btn-delete').addEventListener('click', async () => {
                const ok = await Confirm.show('Remover', `Deseja apagar "${card.titulo}"?`, 'Sim, apagar', 'Não');
                if (!ok) return;
                
                try {
                    await ApiClient.deleteCard(card.id);
                    this.removeCard(card.id);
                    Toast.success('Carta removida');
                } catch (err) { Toast.error(err.message); }
            });
        }

        this.el.grid.appendChild(item);
    },
};

export default CardList;
