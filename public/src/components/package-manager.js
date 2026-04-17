import ApiClient from '../utils/api-client.js';

const PackageManager = {
    packages: [],
    onChanged: null,

    async init() {
        this.el = {
            modal:       document.getElementById('packages-modal'),
            openBtn:     document.getElementById('btn-manage-packages'),
            closeBtn:    document.getElementById('btn-close-packages'),
            form:        document.getElementById('package-editor-form'),
            inputNome:   document.getElementById('pkg-nome'),
            inputCor:    document.getElementById('pkg-cor'),
            inputId:     document.getElementById('pkg-id'),
            tableBody:   document.getElementById('packages-table-body'),
            saveBtn:     document.getElementById('btn-save-package'),
            
            // Autocomplete
            autoInput:   document.getElementById('field-video'),
            autoDrop:    document.getElementById('packages-autocomplete'),
        };

        this._bindEvents();
        await this.refresh();
    },

    async refresh() {
        try {
            this.packages = await ApiClient.getPackages();
            this._renderTable();
            this.onChanged?.();
        } catch (err) {
            console.error('[PackageManager] Error refreshing:', err);
        }
    },

    _bindEvents() {
        this.el.openBtn?.addEventListener('click', () => {
            this.el.modal.classList.add('active');
        });

        this.el.closeBtn?.addEventListener('click', () => {
            this.el.modal.classList.remove('active');
            this._resetForm();
        });

        this.el.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this._handleSave();
        });

        this.el.modal?.addEventListener('mousedown', (e) => {
            if (e.target === this.el.modal) {
                this.el.modal.classList.remove('active');
                this._resetForm();
            }
        });

        // Autocomplete Events
        this.el.autoInput?.addEventListener('input', () => this._handleAutoInput());
        this.el.autoInput?.addEventListener('focus', () => this._handleAutoInput());
        
        document.addEventListener('click', (e) => {
            if (!this.el.autoInput?.contains(e.target) && !this.el.autoDrop?.contains(e.target)) {
                this.el.autoDrop?.classList.remove('active');
            }
        });
    },

    _handleAutoInput() {
        const val = this.el.autoInput.value.toLowerCase();
        const filtered = this.packages.filter(p => p.nome.toLowerCase().includes(val));
        
        if (filtered.length > 0) {
            this._renderAutocomplete(filtered);
            this.el.autoDrop.classList.add('active');
        } else {
            this.el.autoDrop.classList.remove('active');
        }
    },

    _renderAutocomplete(list) {
        this.el.autoDrop.innerHTML = list.map(pkg => `
            <div class="autocomplete-item" data-nome="${pkg.nome}" data-cor="${pkg.cor}">
                <div class="autocomplete-color" style="background: ${pkg.cor}"></div>
                <span>${pkg.nome}</span>
            </div>
        `).join('');

        this.el.autoDrop.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                this.el.autoInput.value = item.dataset.nome;
                this.el.autoDrop.classList.remove('active');
                
                // Trigger event to sync color in Form
                this.el.autoInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    },

    async _handleSave() {
        const pkgData = {
            nome: this.el.inputNome.value.trim(),
            cor:  this.el.inputCor.value,
        };
        const id = this.el.inputId.value;

        try {
            if (id) {
                await ApiClient.updatePackage(id, pkgData);
            } else {
                await ApiClient.createPackage(pkgData);
            }
            this._resetForm();
            await this.refresh();
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    },

    _resetForm() {
        this.el.form.reset();
        this.el.inputId.value = '';
        this.el.saveBtn.textContent = 'Salvar';
    },

    _renderTable() {
        if (!this.el.tableBody) return;
        this.el.tableBody.innerHTML = this.packages.map(pkg => `
            <tr>
                <td>${pkg.nome}</td>
                <td>
                    <div class="color-swatch" style="background: ${pkg.cor};"></div>
                </td>
                <td>
                    <div class="pkg-actions">
                        <button class="btn-icon btn-edit-pkg" data-id="${pkg.id}" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete-pkg" data-id="${pkg.id}" title="Excluir">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.el.tableBody.querySelectorAll('.btn-edit-pkg').forEach(btn => {
            btn.addEventListener('click', () => this._editPackage(btn.dataset.id));
        });

        this.el.tableBody.querySelectorAll('.btn-delete-pkg').forEach(btn => {
            btn.addEventListener('click', () => this._deletePackage(btn.dataset.id));
        });
    },

    _editPackage(id) {
        const pkg = this.packages.find(p => p.id === id);
        if (!pkg) return;

        this.el.inputNome.value = pkg.nome;
        this.el.inputCor.value  = pkg.cor;
        this.el.inputId.value    = pkg.id;
        this.el.saveBtn.textContent = 'Atualizar';
        this.el.inputNome.focus();
    },

    async _deletePackage(id) {
        if (!confirm('Excluir este pacote?')) return;
        try {
            await ApiClient.deletePackage(id);
            await this.refresh();
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    },

    getColorForPackage(name) {
        const pkg = this.packages.find(p => p.nome.toLowerCase() === name.toLowerCase().trim());
        return pkg ? pkg.cor : null;
    }
};

export default PackageManager;
