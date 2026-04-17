import { SUPABASE_URL } from '../config.js';

const BASE = '/api';

/** Helper para pegar o token sem depender do AuthManager (evita ciclo) */
function getLocalToken() {
    const projectID = new URL(SUPABASE_URL).hostname.split('.')[0];
    const storageKey = `sb-${projectID}-auth-token`;
    const session = JSON.parse(localStorage.getItem(storageKey));
    return session?.access_token || null;
}

/** Wrapper fetch com tratamento de erro padrão */
async function apiFetch(url, options = {}) {
    // Adicionar token se existir
    const token = getLocalToken();
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    const res = await fetch(url, options);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro HTTP ${res.status}`);
    }
    return res.json();
}

const ApiClient = {

    getCards() {
        return apiFetch(`${BASE}/cards`);
    },

    getPackages() {
        return apiFetch(`${BASE}/packages`);
    },

    createPackage(pkgData) {
        return apiFetch(`${BASE}/packages`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(pkgData),
        });
    },

    updatePackage(id, pkgData) {
        return apiFetch(`${BASE}/packages/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(pkgData),
        });
    },

    deletePackage(id) {
        return apiFetch(`${BASE}/packages/${id}`, { method: 'DELETE' });
    },

    createCard(cardData) {
        return apiFetch(`${BASE}/cards`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(cardData),
        });
    },

    updateCard(id, cardData) {
        return apiFetch(`${BASE}/cards/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(cardData),
        });
    },

    deleteCard(id) {
        return apiFetch(`${BASE}/cards/${id}`, { method: 'DELETE' });
    },

        uploadPhoto(file) {
        const formData = new FormData();
        formData.append('photo', file);
        return apiFetch(`${BASE}/photos`, { method: 'POST', body: formData });
    },

        exportCsv() {
        window.location.href = `${BASE}/export/csv`;
    },

    async importCsv(file) {
        const formData = new FormData();
        formData.append('csv', file);
        return apiFetch(`${BASE}/import/csv`, { method: 'POST', body: formData });
    },

    exportPdf(format = 'a4', cutmarks = false, bleed = 3) {
        const params = new URLSearchParams({ format, cutmarks, bleed });
        // Abrir em nova aba (geração leva alguns segundos)
        window.open(`${BASE}/export/pdf?${params}`, '_blank');
    },

    exportPdfBacks(format = 'a4', cutmarks = false, bleed = 3) {
        const params = new URLSearchParams({ format, cutmarks, bleed });
        window.open(`${BASE}/export/pdf-backs?${params}`, '_blank');
    },

    async exportBundleZip(config) {
        const res = await fetch(`${BASE}/export/bundle`, {
            method:  'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${getLocalToken()}` 
            },
            body:    JSON.stringify(config),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Erro HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${config.name}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },

    // --- ADMIN ---
    async getProfiles() {
        return apiFetch(`${BASE}/admin/profiles`);
    },

    async inviteUser(email, role = 'member') {
        return apiFetch(`${BASE}/admin/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role })
        });
    },

    async createUser(email, password, role = 'member') {
        return apiFetch(`${BASE}/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
    },

    async updateRole(userId, role) {
        return apiFetch(`${BASE}/admin/profiles/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
    },

    async deleteProfile(userId) {
        return apiFetch(`${BASE}/admin/profiles/${userId}`, {
            method: 'DELETE'
        });
    },

    async getAuditLogs() {
        return apiFetch(`${BASE}/admin/logs`);
    },
};

export default ApiClient;
