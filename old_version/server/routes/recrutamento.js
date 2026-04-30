const express = require('express');
const EmailService = require('../services/emailService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();

/**
 * Receber candidatura de recrutamento
 */
router.post('/', async (req, res) => {
    const applicantData = req.body;

    try {
        // 1. Opcional: Enviar para Google Forms (Backend side para evitar CORS/Opaque issues)
        // Se o usuário quiser manter o Google Forms como backup
        const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfxr9VJPKWuexwyKdOad1xMimh4EcyGlXH216awpjDGmSfQ0A/formResponse';
        
        // Mapeamento de campos do Victor
        const googleFormData = new URLSearchParams();
        googleFormData.append('entry.399809146', applicantData.nome);
        googleFormData.append('entry.874330770', applicantData.email);
        googleFormData.append('entry.1721457765', applicantData.whatsapp);
        googleFormData.append('entry.16850888', applicantData.discord || '');
        googleFormData.append('entry.1675538044', applicantData.origem);
        googleFormData.append('entry.1337427364', applicantData.motivo);
        googleFormData.append('entry.1246449200', applicantData.ajuda);
        googleFormData.append('entry.1917260122', applicantData.area);
        googleFormData.append('entry.676025900', applicantData.disponibilidade);

        // Envio assíncrono para o Google (não travamos a resposta do usuário por isso)
        fetch(GOOGLE_FORM_URL, {
            method: 'POST',
            body: googleFormData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).catch(err => console.error('[Recrutamento] Erro Google Forms:', err));

        // 2. Enviar Alerta via Resend para o Victor
        await EmailService.sendRecruitmentAlert(applicantData);

        res.json({ ok: true, message: 'Candidatura enviada com sucesso!' });
    } catch (err) {
        console.error('[Recrutamento] Erro geral:', err);
        res.status(500).json({ error: 'Erro ao processar candidatura' });
    }
});

module.exports = router;
