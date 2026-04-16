const BASE = '/api';

/** Wrapper fetch com tratamento de erro padrão */
async function apiFetch(url, options = {}) {
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
};

export default ApiClient;
