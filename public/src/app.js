import Form     from './components/form.js';
import CardList from './components/card-list.js';
import ApiClient from './utils/api-client.js';

document.addEventListener('DOMContentLoaded', async () => {

    Form.init();
    await CardList.init();

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

    const formatSelector = document.getElementById('format-selector');
    const formatTrigger  = document.getElementById('format-trigger');
    const formatText     = document.getElementById('format-selected-text');
    let currentFormat    = 'a4';

    formatTrigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        formatSelector?.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        formatSelector?.classList.remove('open');
    });

    formatSelector?.querySelectorAll('.dropdown-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            currentFormat = opt.dataset.value;
            formatText.textContent = opt.textContent;
            formatSelector.classList.remove('open');
        });
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
        const cutmarks = document.getElementById('toggle-cutmarks')?.checked ?? false;
        const bleed    = parseFloat(document.getElementById('input-bleed')?.value || '3');
        ApiClient.exportPdf(currentFormat, cutmarks, bleed);
    });

    document.getElementById('btn-export-backs')?.addEventListener('click', () => {
        const cutmarks = document.getElementById('toggle-cutmarks')?.checked ?? false;
        const bleed    = parseFloat(document.getElementById('input-bleed')?.value || '3');
        ApiClient.exportPdfBacks(currentFormat, cutmarks, bleed);
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        ApiClient.exportCsv();
    });

    document.getElementById('input-import-csv')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const result = await ApiClient.importCsv(file);
            await CardList._loadFromServer();    // recarrega lista completa
            alert(`${result.imported} carta(s) importada(s) com sucesso!`);
        } catch (err) {
            alert('Erro ao importar CSV:\n' + err.message);
        }
        e.target.value = '';    // reseta o input
    });

});
