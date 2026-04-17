import ApiClient from '../utils/api-client.js';
import Toast     from '../utils/toast.js';

const AdminManager = {
    el: {},

    init() {
        this.el = {
            panel:     document.getElementById('admin-panel'),
            tabs:      document.querySelectorAll('.admin-tabs button'),
            tabContents: document.querySelectorAll('.admin-tab-content'),
            usersList: document.getElementById('users-list'),
            logsList:  document.getElementById('logs-list'),
            btnInvite: document.getElementById('btn-invite'),
            inputEmail: document.getElementById('invite-email'),
            selectRole: document.getElementById('invite-role'),

            // Novo Modal "Adicionar Usuário"
            btnAddUserModal: document.getElementById('btn-show-add-user'),
            addUserModal:    document.getElementById('add-user-modal'),
            btnCloseAddUser: document.getElementById('btn-close-add-user'),
            addUserForm:     document.getElementById('add-user-form'),
        };

        if (!this.el.panel) return;

        this._bindEvents();
    },

    /**
     * Chamado pelo AuthManager quando detecta que o usuário é ADMIN
     */
    async show() {
        if (!this.el.panel) return;
        this.el.panel.classList.remove('hidden');
        await this.loadUsers();
        await this.loadLogs();
    },

    hide() {
        if (this.el.panel) {
            this.el.panel.classList.add('hidden');
        }
    },

    _bindEvents() {
        // Alternância de Abas
        this.el.tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                this.el.tabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.el.tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${tab}`);
                });
            });
        });

        // Botão Convidar
        this.el.btnInvite?.addEventListener('click', async () => {
            const email = this.el.inputEmail.value.trim();
            const role  = this.el.selectRole.value;

            if (!email) return Toast.error('Digite um e-mail válido');

            try {
                this.el.btnInvite.disabled = true;
                await ApiClient.inviteUser(email, role);
                Toast.success(`Convite enviado para ${email}`);
                this.el.inputEmail.value = '';
                await this.loadUsers();
            } catch (err) {
                Toast.error(err.message);
            } finally {
                this.el.btnInvite.disabled = false;
            }
        });

        // Modal "Adicionar Usuário"
        this.el.btnAddUserModal?.addEventListener('click', () => {
            this.el.addUserModal.classList.add('active');
        });

        this.el.btnCloseAddUser?.addEventListener('click', () => {
            this.el.addUserModal.classList.remove('active');
        });

        this.el.addUserForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('add-user-email').value.trim();
            const pass  = document.getElementById('add-user-password').value;
            const role  = document.getElementById('add-user-role').value;

            try {
                const btn = this.el.addUserForm.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Criando...';

                await ApiClient.createUser(email, pass, role);
                
                Toast.success(`Usuário ${email} criado com sucesso!`);
                this.el.addUserModal.classList.remove('active');
                this.el.addUserForm.reset();
                await this.loadUsers();
            } catch (err) {
                Toast.error(err.message);
            } finally {
                const btn = this.el.addUserForm.querySelector('button[type="submit"]');
                btn.disabled = false;
                btn.textContent = 'Criar Usuário';
            }
        });
    },

    async loadUsers() {
        try {
            const users = await ApiClient.getProfiles();
            this.el.usersList.innerHTML = users.map(u => `
                <tr class="admin-row">
                    <td class="user-email">
                        <span class="email-text">${u.email}</span>
                        ${u.role === 'admin' ? '<span class="badge badge-admin">ROOT</span>' : ''}
                    </td>
                    <td>
                        <select class="admin-select role-select" data-id="${u.id}">
                            <option value="visitor" ${u.role === 'visitor' ? 'selected' : ''}>Visitante</option>
                            <option value="member" ${u.role === 'member' ? 'selected' : ''}>Membro</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td class="admin-actions">
                        <button class="btn-admin-action btn-save" data-id="${u.id}">💾 <span>Salvar</span></button>
                        <button class="btn-admin-action btn-delete" data-id="${u.id}">🗑️ <span>Excluir</span></button>
                    </td>
                </tr>
            `).join('');

            // Eventos para salvar cargo
            this.el.usersList.querySelectorAll('.btn-save').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const select = this.el.usersList.querySelector(`.role-select[data-id="${id}"]`);
                    try {
                        btn.classList.add('loading');
                        await ApiClient.updateRole(id, select.value);
                        Toast.success('Cargo atualizado com sucesso');
                    } catch (err) { Toast.error(err.message); }
                    finally { btn.classList.remove('loading'); }
                });
            });

            // Eventos para excluir
            this.el.usersList.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    if (!confirm('Tem certeza que deseja remover este usuário da equipe?')) return;
                    try {
                        await ApiClient.deleteProfile(id);
                        Toast.success('Usuário removido');
                        await this.loadUsers();
                    } catch (err) { Toast.error(err.message); }
                });
            });

        } catch (err) { console.error('[Admin] Erro ao carregar usuários:', err); }
    },

    async loadLogs() {
        try {
            const logs = await ApiClient.getAuditLogs();
            this.el.logsList.innerHTML = logs.map(l => {
                const date = new Date(l.created_at).toLocaleString('pt-BR');
                const user = l.profiles?.email || 'Sistema';
                
                return `
                    <div class="log-item">
                        <div class="log-header">
                            <span class="log-user">${user}</span>
                            <span class="log-date">${date}</span>
                        </div>
                        <div class="log-desc">${l.description || `${l.action} em ${l.table_name}`}</div>
                        ${this._renderDiff(l)}
                    </div>
                `;
            }).join('');
        } catch (err) { console.error('[Admin] Erro ao carregar logs:', err); }
    },

    _renderDiff(log) {
        if (log.action === 'CREATE' || !log.old_data || !log.new_data) return '';
        
        // Simples diff visual se houver descrição de mudanças
        return ``;
    }
};

export default AdminManager;
