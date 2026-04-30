const { Resend } = require('resend');
require('dotenv').config();

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

if (!resend) {
    console.warn('[EmailService] RESEND_API_KEY não encontrada. O envio de e-mails está desativado.');
}

const EmailService = {
    async sendInvite(email, inviteLink) {
        if (!resend) {
            console.warn('[EmailService] Tentativa de enviar convite sem API Key do Resend.');
            return;
        }
        try {
            const { data, error } = await resend.emails.send({
                from: 'Balela Season Pass <onboarding@resend.dev>', 
                to: [email],
                subject: 'Você foi convidado para a equipe Balela Trunfo! 🃏',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0b0618; color: #ffffff; padding: 40px; border-radius: 12px; border: 2px solid #7b2fbe;">
                        <h1 style="color: #7b2fbe; font-size: 24px; margin-bottom: 20px;">Bem-vindo à Equipe!</h1>
                        <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                            Olá! Victor Zanin Rubinec convidou você para fazer parte da equipe de desenvolvimento do 
                            <strong>Season Pass Balela</strong>.
                        </p>
                        <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                            Com sua conta, você poderá criar cartas, gerenciar coleções e ajudar o projeto a crescer.
                        </p>
                        <div style="margin: 40px 0; text-align: center;">
                            <a href="${inviteLink}" style="background: #7b2fbe; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                Aceitar Convite e Definir Senha
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; text-align: center;">
                            Se o botão acima não funcionar, copie e cole este link no seu navegador:<br>
                            <span style="color: #7b2fbe; word-break: break-all;">${inviteLink}</span>
                        </p>
                        <hr style="border: none; border-top: 1px solid #1e1b4b; margin: 40px 0;">
                        <p style="font-size: 12px; color: #64748b; text-align: center;">
                            Balela Trunfo © 2026 • Projeto de Fã para Fã
                        </p>
                    </div>
                `
            });

            if (error) {
                console.error('[EmailService] Erro Resend:', error);
                throw error;
            }

            return data;
        } catch (err) {
            console.error('[EmailService] Falha ao enviar convite:', err);
            throw err;
        }
    },

    async sendRecruitmentAlert(applicantData) {
        if (!resend) {
            console.warn('[EmailService] Alerta de recrutamento não enviado (API Key ausente).');
            return;
        }
        try {
            await resend.emails.send({
                from: 'Recrutamento Balela <alerts@resend.dev>',
                to: ['victor.zanin.rubinec@gmail.com'], // E-mail do Victor
                subject: `Novo Candidato: ${applicantData.nome} 🚀`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>Novo formulário de recrutamento recebido!</h2>
                        <p><strong>Nome:</strong> ${applicantData.nome}</p>
                        <p><strong>E-mail:</strong> ${applicantData.email}</p>
                        <p><strong>Motivo:</strong> ${applicantData.motivo}</p>
                        <hr>
                        <p>Acesse o painel para ver mais detalhes.</p>
                    </div>
                `
            });
        } catch (err) {
            console.error('[EmailService] Falha ao enviar alerta de recrutamento:', err);
        }
    },

    async sendSimpleEmail({ to, subject, html }) {
        if (!resend) {
            console.warn('[EmailService] Resend não configurado.');
            return;
        }
        try {
            const { data, error } = await resend.emails.send({
                from: 'Balela <onboarding@resend.dev>',
                to: to || ['vrubinec@gmail.com'],
                subject: subject || 'Hello World',
                html: html || '<p>Congrats on sending your <strong>first email</strong>!</p>'
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[EmailService] Falha no envio simples:', err);
            throw err;
        }
    },

    /**
     * Enviar e-mail de redefinição de senha
     */
    async sendPasswordReset(email, resetLink) {
        if (!resend) return;
        try {
            await resend.emails.send({
                from: 'Balela Trunfo <onboarding@resend.dev>',
                to: [email],
                subject: 'Redefinição de Senha - Balela Trunfo 🔑',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0b0618; color: #ffffff; padding: 40px; border-radius: 12px; border: 2px solid #7b2fbe;">
                        <h2 style="color: #7b2fbe;">Esqueceu sua senha?</h2>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta no Balela Trunfo.</p>
                        <p>Clique no botão abaixo para escolher uma nova senha:</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${resetLink}" style="background: #7b2fbe; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Redefinir Senha</a>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8;">Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
                    </div>
                `
            });
        } catch (err) {
            console.error('[EmailService] Erro ao enviar reset de senha:', err);
        }
    },

    /**
     * Enviar confirmação de inscrição no recrutamento
     */
    async sendRecruitmentConfirmation(email, name) {
        if (!resend) return;
        try {
            await resend.emails.send({
                from: 'Recrutamento Balela <onboarding@resend.dev>',
                to: [email],
                subject: 'Recebemos sua inscrição! 🚀 - Balela Trunfo',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0b0618; color: #ffffff; padding: 40px; border-radius: 12px; border: 2px solid #7b2fbe;">
                        <h2 style="color: #7b2fbe;">Olá, ${name}!</h2>
                        <p>Sua inscrição para o recrutamento do Balela Trunfo foi recebida com sucesso.</p>
                        <p>Nossa equipe irá analisar seu perfil e entraremos em contato em breve caso você seja selecionado para a próxima etapa.</p>
                        <p>Obrigado pelo interesse em fazer parte do projeto!</p>
                        <hr style="border: none; border-top: 1px solid #1e1b4b; margin: 20px 0;">
                        <p style="font-size: 12px; color: #64748b; text-align: center;">Balela Trunfo © 2026</p>
                    </div>
                `
            });
        } catch (err) {
            console.error('[EmailService] Erro ao enviar confirmação de recrutamento:', err);
        }
    }
};

module.exports = EmailService;
