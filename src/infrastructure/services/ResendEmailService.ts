import { Resend } from 'resend';

export interface RecruitmentPayload {
  nomeApelido: string;
  email: string;
  whatsapp: string;
  discord: string;
  comoConheceu: string;
  porQueEntrar: string;
  comoPodeAjudar: string;
  areaInteresse: string;
  disponibilidade: string;
}

export class ResendEmailService {
  private resend: Resend | null;

  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  }

  async sendRecruitmentNotification(payload: RecruitmentPayload) {
    if (!this.resend) {
      return { skipped: true };
    }

    const from = process.env.RESEND_FROM_EMAIL || 'Balela Trunfo <onboarding@resend.dev>';
    const to = process.env.RECRUITMENT_TO_EMAIL || 'admin@balela.local';

    const subject = `[Recrutamento] ${payload.nomeApelido}`;
    const text = [
      'Nova candidatura recebida.',
      '',
      `Nome / Apelido: ${payload.nomeApelido}`,
      `Email: ${payload.email}`,
      `Whatsapp: ${payload.whatsapp}`,
      `Discord: ${payload.discord}`,
      `Como conheceu: ${payload.comoConheceu}`,
      `Area de interesse: ${payload.areaInteresse}`,
      `Disponibilidade: ${payload.disponibilidade}`,
      '',
      'Por que quer entrar no projeto?',
      payload.porQueEntrar,
      '',
      'Como pode ajudar?',
      payload.comoPodeAjudar,
    ].join('\n');

    await this.resend.emails.send({ from, to, subject, text });
    return { skipped: false };
  }
}
