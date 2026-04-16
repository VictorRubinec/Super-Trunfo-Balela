import ModelRegistry from '../models/model-registry.js';
import ApiClient     from '../utils/api-client.js';

const CardList = {
    cards:  [],
    onEdit: null,   // callback: (cardData) => void
    el:     {},

        async init() {
        this.el.grid  = document.getElementById('gallery-grid');
        this.el.empty = document.getElementById('gallery-empty');
        this.el.count = document.getElementById('gallery-count');

        await this._loadFromServer();
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

        // Contador
        if (count) {
            const n = this.cards.length;
            count.textContent = `${n} carta${n !== 1 ? 's' : ''}`;
        }

        // Limpa itens anteriores (preserva #gallery-empty)
        grid.querySelectorAll('.gallery-item').forEach(el => el.remove());

        // Estado vazio
        if (this.cards.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        // Renderiza cada carta
        this.cards.forEach(card => this._renderItem(card));
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
                <button class="btn btn-secondary btn-edit" title="Editar">✏ Editar</button>
                <button class="btn btn-danger btn-delete" title="Deletar">🗑</button>
            </div>
        `;

        // Editar
        item.querySelector('.btn-edit').addEventListener('click', () => {
            this.onEdit?.(card);
        });

        // Deletar
        item.querySelector('.btn-delete').addEventListener('click', async () => {
            if (!confirm(`Deletar a carta "${card.titulo}"?`)) return;
            try {
                await ApiClient.deleteCard(card.id);
                this.removeCard(card.id);
            } catch (err) {
                alert('Erro ao deletar: ' + err.message);
            }
        });

        this.el.grid.appendChild(item);
    },
};

export default CardList;
