import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import Toast from '../utils/toast.js';
import AdminManager from './admin-manager.js';

const AuthManager = {
    client: null,
    user: null,
    profile: null,
    session: null,

    el: {
        btnShowLogin: document.getElementById('btn-show-login'),
        btnLogout:    document.getElementById('btn-logout'),
        modal:        document.getElementById('login-modal'),
        form:         document.getElementById('login-form'),
        error:        document.getElementById('login-error'),
        btnClose:     document.getElementById('btn-close-login'),
        profileView:  document.getElementById('user-profile'),
        displayEmail: document.getElementById('display-user-email'),
        displayRole:  document.getElementById('display-user-role'),
        
        // Reset Password
        resetModal:   document.getElementById('reset-password-modal'),
        resetForm:    document.getElementById('reset-password-form'),
        resetError:   document.getElementById('reset-error'),
        btnCloseReset: document.getElementById('btn-close-reset'),

        // Onboarding (Phase 4)
        onboardingModal: document.getElementById('onboarding-modal'),
        onboardingForm:  document.getElementById('onboarding-form')
    },

    async init() {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        this._bindEvents();
        this._setupAuthListener();
        this._checkHashEvents();
        await this.checkSession();
    },

    _setupAuthListener() {
        this.client.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] Evento:', event);
            this.session = session;
            this.user    = session?.user;

            // UI Logada básica imediata (não espera o banco)
            this.updateUI();

            if (session) {
                // Busca perfil em paralelo
                this.fetchProfile().then(() => this.updateUI());
            } else {
                this.profile = null;
                this.updateUI();
            }

            // Ativa modais de recuperação ou convite
            if (event === 'PASSWORD_RECOVERY') {
                this.el.resetModal?.classList.add('active');
            }
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                this._checkHashEvents();
            }
        });
    },

    _checkHashEvents() {
        const hash = window.location.hash;
        if (hash.includes('type=invite') || hash.includes('type=recovery') || hash.includes('access_token=')) {
            if (hash.includes('type=invite')) {
                this.el.onboardingModal?.classList.add('active');
            } else if (hash.includes('type=recovery')) {
                this.el.resetModal?.classList.add('active');
            }
            window.history.replaceState(null, null, ' ');
        }
    },

    _bindEvents() {
        this.el.btnShowLogin?.addEventListener('click', () => {
             this.el.modal.classList.add('active');
        });

        this.el.btnClose?.addEventListener('click', () => this.el.modal.classList.remove('active'));
        this.el.btnCloseReset?.addEventListener('click', () => this.el.resetModal.classList.remove('active'));

        this.el.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            this.login(email, password);
        });

        this.el.resetForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('reset-new-password').value;
            this.updatePassword(newPassword);
        });

        this.el.onboardingForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pass = document.getElementById('onboarding-password').value;
            const confirm = document.getElementById('onboarding-confirm').value;
            if (pass !== confirm) return Toast.error('As senhas não conferem');
            try {
                const { error } = await this.client.auth.updateUser({ password: pass });
                if (error) throw error;
                Toast.success('Senha definida com sucesso!');
                this.el.onboardingModal.classList.remove('active');
            } catch (err) { Toast.error(err.message); }
        });

        this.el.btnLogout?.addEventListener('click', () => this.logout());
    },

    async checkSession() {
        const { data: { session } } = await this.client.auth.getSession();
        this.session = session;
        if (session) {
            this.user = session.user;
            await this.fetchProfile();
        }
        this.updateUI();
    },

    async fetchProfile() {
        if (!this.user) return;
        try {
            const { data, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', this.user.id)
                .single();
            if (!error) this.profile = data;
        } catch (err) { console.error('[Auth] Erro perfil:', err); }
    },

    async login(email, password) {
        const btn = this.el.form.querySelector('button[type="submit"]');
        try {
            if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
            const { error } = await this.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            this.el.modal.classList.remove('active');
            window.location.reload(); 
        } catch (err) {
            Toast.error('Erro ao entrar: ' + err.message);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
        }
    },

    async logout() {
        await this.client.auth.signOut();
        window.location.reload();
    },

    updateUI() {
        const isLoggedIn = !!this.user;
        const role = this.profile?.role || (isLoggedIn ? 'member' : 'anonymous');

        // Limpar classes de estado
        document.body.classList.remove('is-anonymous', 'is-visitor', 'is-member', 'is-admin', 'logged-in');
        
        if (isLoggedIn) {
            document.body.classList.add('logged-in');
            this.el.btnShowLogin?.classList.add('hidden');
            this.el.profileView?.classList.remove('hidden');
            if (this.el.displayEmail) this.el.displayEmail.textContent = this.user.email;
            
            // Texto legível para o cargo
            const roleLabels = { 'admin': 'Admin', 'member': 'Membro', 'visitor': 'Visitante' };
            if (this.el.displayRole)  this.el.displayRole.textContent = roleLabels[role] || role;
        } else {
            this.el.btnShowLogin?.classList.remove('hidden');
            this.el.profileView?.classList.add('hidden');
        }

        // Aplicar classe de cargo no body para CSS
        document.body.classList.add(`is-${role}`);

        // Gestão específica de painéis
        if (role === 'admin') AdminManager.show();
        else AdminManager.hide();
    },

    getToken() { return this.session?.access_token || null; },
    isAdmin() { return this.profile?.role === 'admin'; }
};

export default AuthManager;
