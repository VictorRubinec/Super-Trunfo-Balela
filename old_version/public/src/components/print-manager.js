import ApiClient from '../utils/api-client.js';
import PackageManager from './package-manager.js';

const PrintManager = {
    selectedCards: {}, // Map of cardId -> { selected: bool, quantity: number }
    pkgMultipliers: {}, // Map of pkgName -> multiplier
    allCards: [],
    currentFormat: 'a4',

    PAGE_CAPACITY: {
        'a4': { w: 210, h: 297 },
        'super-a4': { w: 225, h: 320 },
        'a3': { w: 297, h: 420 },
        'super-a3': { w: 320, h: 450 }
    },

    // Dimensões padrão (devem bater com o server)
    CARD_W: 63,
    CARD_H: 88,
    PAGE_MARGIN: 10,

    calculateBestGrid(format, bleed) {
        const fmt = this.PAGE_CAPACITY[format];
        if (!fmt) return 9; // fallback

        const availW = fmt.w - this.PAGE_MARGIN * 2;
        const availH = fmt.h - this.PAGE_MARGIN * 2;
        const cellW = this.CARD_W + bleed * 2;
        const cellH = this.CARD_H + bleed * 2;

        // Versão Retrato
        const cols1 = Math.floor(availW / cellW);
        const rows1 = Math.floor(availH / cellH);
        const total1 = cols1 * rows1;

        // Versão Paisagem (rotacionando a carta para caber melhor)
        const cellW2 = this.CARD_H + bleed * 2;
        const cellH2 = this.CARD_W + bleed * 2;
        const cols2 = Math.floor(availW / cellW2);
        const rows2 = Math.floor(availH / cellH2);
        const total2 = cols2 * rows2;

        return Math.max(total1, total2);
    },

    async init() {
        this.el = {
            modal:         document.getElementById('print-modal'),
            openBtn:       document.getElementById('btn-open-print-modal'),
            closeBtn:      document.getElementById('btn-close-print'),
            generateBtn:   document.getElementById('btn-generate-zip'),
            treeContainer: document.getElementById('print-selection-tree'),
            
            // Filters/Config
            projectName:   document.getElementById('print-project-name'),
            formatTrigger: document.getElementById('print-format-trigger'),
            formatOptions: document.getElementById('print-format-options'),
            formatText:    document.getElementById('print-format-selected-text'),
            capacityInfo:  document.getElementById('format-capacity-info'),
            inputBleed:    document.getElementById('print-bleed'),
            checkCutmarks: document.getElementById('print-cutmarks'),
            
            // Selection Actions
            btnSelectAll:  document.getElementById('btn-print-select-all'),
            btnSelectNone: document.getElementById('btn-print-select-none'),
            
            // Summary
            totalCards:    document.getElementById('summary-total-cards'),
            totalSheets:   document.getElementById('summary-total-sheets'),
        };

        this._bindEvents();
    },

    _bindEvents() {
        this.el.openBtn?.addEventListener('click', () => this.open());
        this.el.closeBtn?.addEventListener('click', () => this.close());
        this.el.generateBtn?.addEventListener('click', () => this.handleExport());
        
        this.el.btnSelectAll?.addEventListener('click', () => this.toggleAll(true));
        this.el.btnSelectNone?.addEventListener('click', () => this.toggleAll(false));

        // Format Dropdown
        this.el.formatTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.el.modal.querySelector('#print-format-selector').classList.toggle('open');
        });

        this.el.formatOptions?.querySelectorAll('.dropdown-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                this.currentFormat = opt.dataset.value;
                this.el.formatText.textContent = opt.textContent;
                this.el.modal.querySelector('#print-format-selector').classList.remove('open');
                this.updateSummary();
            });
        });

        this.el.inputBleed?.addEventListener('input', () => this.updateSummary());
        this.el.checkCutmarks?.addEventListener('change', () => this.updateSummary());

        // Close dropdown when clicking outside
        this.el.modal?.addEventListener('click', (e) => {
            if (!e.target.closest('#print-format-selector')) {
                this.el.modal.querySelector('#print-format-selector')?.classList.remove('open');
            }
        });
    },

    async open() {
        this.el.modal.classList.add('active');
        this.el.projectName.value = `Impressao_${new Date().toISOString().split('T')[0]}`;
        await this.loadData();
    },

    close() {
        this.el.modal.classList.remove('active');
    },

    async loadData() {
        try {
            this.allCards = await ApiClient.getCards();
            this._initializeState();
            this.renderTree();
            this.updateSummary();
        } catch (err) {
            console.error('[PrintManager] Error loading cards:', err);
        }
    },

    _initializeState() {
        this.selectedCards = {};
        this.pkgMultipliers = {};
        
        const packages = [...new Set(this.allCards.map(c => c.video_origem || 'Sem Pacote'))];
        packages.forEach(pkg => this.pkgMultipliers[pkg] = 1);

        this.allCards.forEach(card => {
            this.selectedCards[card.id] = { selected: true, quantity: 1 };
        });
    },

    toggleAll(selected) {
        Object.keys(this.selectedCards).forEach(id => {
            this.selectedCards[id].selected = selected;
        });
        this.renderTree();
        this.updateSummary();
    },

    isPkgAllSelected(pkgName) {
        const pkgCards = this.allCards.filter(c => (c.video_origem || 'Sem Pacote') === pkgName);
        return pkgCards.every(c => this.selectedCards[c.id].selected);
    },

    togglePkgCards(pkgName, selected) {
        this.allCards.forEach(card => {
            if ((card.video_origem || 'Sem Pacote') === pkgName) {
                this.selectedCards[card.id].selected = selected;
            }
        });
        this.renderTree();
        this.updateSummary();
    },

    renderTree() {
        const grouped = {};
        this.allCards.forEach(card => {
            const pkg = card.video_origem || 'Sem Pacote';
            if (!grouped[pkg]) grouped[pkg] = [];
            grouped[pkg].push(card);
        });

        const html = Object.keys(grouped).sort().map(pkgName => {
            const cards = grouped[pkgName];
            const multiplier = this.pkgMultipliers[pkgName] || 1;
            const pkgColor = PackageManager.getColorForPackage(pkgName) || '#7B2FBE';

            const cardsHtml = cards.map(card => {
                const state = this.selectedCards[card.id];
                return `
                    <div class="print-tree-card ${state.selected ? 'selected' : ''}">
                        <label class="print-card-main">
                            <input type="checkbox" class="card-check" data-id="${card.id}" ${state.selected ? 'checked' : ''} />
                            <span class="card-name">${card.titulo || 'Sem Título'}</span>
                        </label>
                        <div class="card-qty-control">
                            <button class="qty-btn minus" data-id="${card.id}">-</button>
                            <input type="number" class="qty-input" data-id="${card.id}" value="${state.quantity}" min="1" max="99" />
                            <button class="qty-btn plus" data-id="${card.id}">+</button>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="print-tree-package" data-pkg="${pkgName}">
                    <div class="print-package-header" style="border-left-color: ${pkgColor}">
                        <div class="pkg-info">
                            <input type="checkbox" class="pkg-check" data-pkg="${pkgName}" ${this.isPkgAllSelected(pkgName) ? 'checked' : ''} />
                            <button class="btn-toggle-pkg">▼</button>
                            <span class="pkg-title">${pkgName}</span>
                            <span class="pkg-count">(${cards.length} cartas)</span>
                        </div>
                        <div class="pkg-multiplier">
                            <label>Multiplicar Pacote:</label>
                            <input type="number" class="pkg-mult-input" data-pkg="${pkgName}" value="${multiplier}" min="1" max="10" />
                        </div>
                    </div>
                    <div class="print-package-content">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }).join('');

        this.el.treeContainer.innerHTML = html;
        this._bindTreeEvents();
    },

    _bindTreeEvents() {
        // Package Checkboxes
        this.el.treeContainer.querySelectorAll('.pkg-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const pkg = e.target.dataset.pkg;
                this.togglePkgCards(pkg, e.target.checked);
            });
        });

        // Checkboxes
        this.el.treeContainer.querySelectorAll('.card-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                this.selectedCards[id].selected = e.target.checked;
                e.target.closest('.print-tree-card').classList.toggle('selected', e.target.checked);
                this.updateSummary();
            });
        });

        // Quantities
        this.el.treeContainer.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                this.selectedCards[id].quantity = parseInt(e.target.value) || 1;
                this.updateSummary();
            });
        });

        this.el.treeContainer.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const input = btn.parentElement.querySelector('.qty-input');
                let val = parseInt(input.value) || 1;
                if (btn.classList.contains('plus')) val++;
                else if (val > 1) val--;
                input.value = val;
                this.selectedCards[id].quantity = val;
                this.updateSummary();
            });
        });

        // Package Multiplier
        this.el.treeContainer.querySelectorAll('.pkg-mult-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const pkg = e.target.dataset.pkg;
                this.pkgMultipliers[pkg] = parseInt(e.target.value) || 1;
                this.updateSummary();
            });
        });

        // Toggle Package
        this.el.treeContainer.querySelectorAll('.btn-toggle-pkg').forEach(btn => {
            btn.addEventListener('click', () => {
                const pkg = btn.closest('.print-tree-package');
                pkg.classList.toggle('collapsed');
                btn.textContent = pkg.classList.contains('collapsed') ? '▶' : '▼';
            });
        });
    },

    updateSummary() {
        const bleed = this.el.checkCutmarks.checked ? parseFloat(this.el.inputBleed.value || '0') : 0;
        let total = 0;
        this.allCards.forEach(card => {
            const state = this.selectedCards[card.id];
            if (state && state.selected) {
                const pkg = card.video_origem || 'Sem Pacote';
                const mult = this.pkgMultipliers[pkg] || 1;
                total += state.quantity * mult;
            }
        });

        const perPage = this.calculateBestGrid(this.currentFormat, bleed);
        const sheets  = Math.ceil(total / perPage);

        this.el.totalCards.textContent = total;
        this.el.totalSheets.textContent = sheets || 0;
        this.el.capacityInfo.textContent = `Cabe ${perPage} cartas por folha (considerando sangria)`;
    },

    async handleExport() {
        const selectedList = [];
        this.allCards.forEach(card => {
            const state = this.selectedCards[card.id];
            if (state && state.selected) {
                const pkg = card.video_origem || 'Sem Pacote';
                const mult = this.pkgMultipliers[pkg] || 1;
                const totalQty = state.quantity * mult;
                
                // Add card ID multiple times based on total quantity
                for (let i = 0; i < totalQty; i++) {
                    selectedList.push(card.id);
                }
            }
        });

        if (selectedList.length === 0) {
            alert('Selecione ao menos uma carta para imprimir.');
            return;
        }

        const btn = this.el.generateBtn;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Gerando ZIP...';

        try {
            const config = {
                format:   this.currentFormat,
                cutmarks: this.el.checkCutmarks.checked,
                bleed:    parseFloat(this.el.inputBleed.value || '3'),
                name:     this.el.projectName.value.trim() || 'Balela_Trunfo',
                ids:      selectedList.join(',')
            };

            await ApiClient.exportBundleZip(config);
            this.close();
        } catch (err) {
            alert('Erro ao gerar exportação:\n' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

export default PrintManager;
