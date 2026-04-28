/**
 * Lógica de envio do formulário de recrutamento para o Google Forms
 */

document.addEventListener('DOMContentLoaded', () => {
    const recruitForm = document.getElementById('recruit-form');
    const formPanel = document.getElementById('form-panel');
    const successPanel = document.getElementById('success-panel');
    const whatsappInput = document.getElementById('field-whatsapp');

    // MÁSCARA WHATSAPP
    if (whatsappInput) {
        whatsappInput.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }

    // CONFIGURAÇÃO: Substitua esses valores após criar o seu Google Form
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfxr9VJPKWuexwyKdOad1xMimh4EcyGlXH216awpjDGmSfQ0A/formResponse';
    
    // IDs das entradas (entry.XXXX)
    const ENTRIES = {
        nome: 'entry.399809146',
        email: 'entry.874330770',
        whatsapp: 'entry.1721457765',
        discord: 'entry.16850888',
        origem: 'entry.1675538044',
        motivo: 'entry.1337427364',
        ajuda: 'entry.1246449200',
        area: 'entry.1917260122',
        disponibilidade: 'entry.676025900'
    };

    if (recruitForm) {
        recruitForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validação Simples
            const requiredFields = recruitForm.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('input-error');
                    isValid = false;
                } else {
                    field.classList.remove('input-error');
                }
            });

            if (!isValid) {
                const firstError = recruitForm.querySelector('.input-error');
                if (firstError) firstError.focus();
                return;
            }
            
            const submitBtn = document.getElementById('btn-submit');
            const originalBtnText = submitBtn.innerHTML;
            
            // Mudar estado do botão
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>⏳</span> Enviando...';

            // Coletar dados do formulário
            const formData = new FormData(recruitForm);
            
            // Criar a URL com os parâmetros para o Google Form
            const googleFormData = new URLSearchParams();
            googleFormData.append(ENTRIES.nome, formData.get('nome'));
            googleFormData.append(ENTRIES.email, formData.get('email'));
            googleFormData.append(ENTRIES.whatsapp, formData.get('whatsapp'));
            googleFormData.append(ENTRIES.discord, formData.get('discord') || 'Não informado');
            googleFormData.append(ENTRIES.origem, formData.get('origem'));
            googleFormData.append(ENTRIES.motivo, formData.get('motivo'));
            googleFormData.append(ENTRIES.ajuda, formData.get('ajuda'));
            googleFormData.append(ENTRIES.area, formData.get('area'));
            googleFormData.append(ENTRIES.disponibilidade, formData.get('disponibilidade'));

            try {
                // Enviar usando fetch com os parâmetros na URL (método GET também funciona no formResponse e é menos bloqueado)
                // ou manter POST mas simplificar os headers.
                await fetch(GOOGLE_FORM_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: googleFormData.toString()
                });

                // Como usamos no-cors, o fetch não "sabe" se deu erro de servidor, 
                // então assumimos sucesso se a requisição foi disparada.
                formPanel.style.display = 'none';
                successPanel.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } catch (error) {
                console.error('Erro ao enviar:', error);
                alert('Ocorreu um erro ao enviar. Por favor, tente novamente.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
