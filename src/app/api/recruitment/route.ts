import { NextResponse } from 'next/server';
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService';
import { supabaseAdmin } from '@/infrastructure/db/supabase-admin';

interface RecruitmentBody {
  nomeApelido?: string;
  email?: string;
  whatsapp?: string;
  discord?: string;
  comoConheceu?: string;
  porQueEntrar?: string;
  comoPodeAjudar?: string;
  areaInteresse?: string;
  disponibilidade?: string;
}

function validate(body: RecruitmentBody) {
  if (!body.nomeApelido || body.nomeApelido.trim().length < 2) return 'Nome / Apelido invalido';
  if (!body.email || !body.email.includes('@')) return 'Email invalido';
  if (!body.whatsapp || body.whatsapp.trim().length < 8) return 'Whatsapp invalido';
  if (!body.discord || body.discord.trim().length < 2) return 'Discord invalido';
  if (!body.comoConheceu || body.comoConheceu.trim().length < 4) return 'Informe como conheceu o projeto';
  if (!body.porQueEntrar || body.porQueEntrar.trim().length < 20) return 'Resposta "Por que quer entrar" muito curta';
  if (!body.comoPodeAjudar || body.comoPodeAjudar.trim().length < 20) return 'Resposta "Como pode ajudar" muito curta';
  if (!body.areaInteresse || body.areaInteresse.trim().length < 2) return 'Area de interesse invalida';
  if (!body.disponibilidade || body.disponibilidade.trim().length < 2) return 'Disponibilidade invalida';
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecruitmentBody;
    const error = validate(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const payload = {
      nomeApelido: body.nomeApelido!.trim(),
      email: body.email!.trim(),
      whatsapp: body.whatsapp!.trim(),
      discord: body.discord!.trim(),
      comoConheceu: body.comoConheceu!.trim(),
      porQueEntrar: body.porQueEntrar!.trim(),
      comoPodeAjudar: body.comoPodeAjudar!.trim(),
      areaInteresse: body.areaInteresse!.trim(),
      disponibilidade: body.disponibilidade!.trim(),
    };

    const emailService = new ResendEmailService();
    const emailResult = await emailService.sendRecruitmentNotification(payload);

    await supabaseAdmin.from('audit_logs').insert({
      action: 'RECRUITMENT_SUBMISSION',
      description: {
        email: payload.email,
        nome_apelido: payload.nomeApelido,
        area_interesse: payload.areaInteresse,
        disponibilidade: payload.disponibilidade,
        email_skipped: emailResult.skipped,
      },
    });

    return NextResponse.json({ ok: true, emailSkipped: emailResult.skipped }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
