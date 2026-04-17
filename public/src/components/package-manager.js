import ApiClient from '../utils/api-client.js';
import Toast     from '../utils/toast.js';

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
            
            // Select no formulário principal
            packageSelect: document.getElementById('field-video'),
        };

        this._bindEvents();
        await this.refresh();
    },

    async refresh() {
        try {
            this.packages = await ApiClient.getPackages();
            
            // Ordenar alfabeticamente
            this.packages.sort((a, b) => a.nome.localeCompare(b.nome));

            this._renderTable();
            this._populateSelect();
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
    },

    /** Preenche o select do formulário de cartas com os pacotes disponíveis */
    _populateSelect() {
        if (!this.el.packageSelect) return;

        // Guardar valor atual para não perder seleção no refresh
        const currentVal = this.el.packageSelect.value;

        this.el.packageSelect.innerHTML = `
            <option value="">Selecione um pacote...</option>
            ${this.packages.map(pkg => `
                <option value="${pkg.nome}" ${pkg.nome === currentVal ? 'selected' : ''}>
                    ${pkg.nome}
                </option>
            `).join('')}
        `;
    },

    async _handleSave() {
        const pkgData = {
            nome: this.el.inputNome.value.trim(),
            cor:  this.el.inputCor.value,
        };
        const id = this.el.inputId.value;

        if (!pkgData.nome) {
            Toast.error('O nome do pacote é obrigatório.');
            return;
        }

        try {
            this.el.saveBtn.disabled = true;
            this.el.saveBtn.textContent = 'Salvando...';

            if (id) {
                await ApiClient.updatePackage(id, pkgData);
                Toast.success('Pacote atualizado! ✨');
            } else {
                await ApiClient.createPackage(pkgData);
                Toast.success('Novo pacote criado! 📦');
            }
            this._resetForm();
            await this.refresh();
        } catch (err) {
            Toast.error('Erro ao salvar pacote: ' + err.message);
        } finally {
            this.el.saveBtn.disabled = false;
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
            <tr class="admin-row">
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="color-swatch-sm" style="background: ${pkg.cor}; border-radius: 4px; width: 14px; height: 14px;"></div>
                        <span style="font-weight: 600;">${pkg.nome}</span>
                    </div>
                </td>
                <td style="text-align: right;">
                    <div class="pkg-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn-icon btn-edit-pkg" data-id="${pkg.id}" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete-pkg" data-id="${pkg.id}" title="Excluir" style="color: #f87171;">🗑️</button>
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
        // Usar o confirm customizado se disponível ou o padrão do navegador
        if (!confirm('Excluir este pacote? Isso NÃO deletará as cartas, mas elas ficarão sem pacote associado.')) return;
        
        try {
            await ApiClient.deletePackage(id);
            Toast.success('Pacote removido.');
            await this.refresh();
        } catch (err) {
            Toast.error('Erro ao excluir: ' + err.message);
        }
    },

    getColorForPackage(name) {
        const pkg = this.packages.find(p => p.nome.toLowerCase() === name.toLowerCase().trim());
        return pkg ? pkg.cor : null;
    }
};

export default PackageManager;
