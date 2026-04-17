import Form     from './components/form.js';
import CardList from './components/card-list.js';
import PackageManager from './components/package-manager.js';
import PrintManager from './components/print-manager.js';
import AuthManager from './components/auth-manager.js';
import AdminManager from './components/admin-manager.js';
import ApiClient from './utils/api-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    // Inicializar Managers
    AdminManager.init();
    await AuthManager.init();
    await PackageManager.init();
    Form.init();
    await CardList.init();
    await PrintManager.init();

    CardList.onEdit = (card) => {
        Form.populate(card);
    };

    document.addEventListener('card:submit', async (e) => {
        const { fotoFile, ...cardData } = e.detail;

        const btn = document.getElementById('btn-add-card');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

        try {
            if (fotoFile) {
                const result     = await ApiClient.uploadPhoto(fotoFile);
                cardData.foto    = result.url;
                cardData.foto_arquivo = result.filename;
            }

            if (cardData.foto?.startsWith('data:')) {
                cardData.foto = '';
                cardData.foto_arquivo = '';
            }

            if (cardData.id) {
                const updated = await ApiClient.updateCard(cardData.id, cardData);
                CardList.replaceCard(updated);
            } else {
                const created = await ApiClient.createCard(cardData);
                CardList.addCard(created);
            }

            Form.reset();

            document.querySelector('.gallery-section')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            alert('Erro ao salvar carta:\n' + err.message);
            console.error('[app] card:submit error:', err);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>✚</span> Adicionar Carta';
            }
        }
    });

    // Removido gerenciador de formato antigo (agora no modal de impressão)
});
