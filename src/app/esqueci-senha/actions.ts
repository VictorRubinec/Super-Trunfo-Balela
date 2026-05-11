'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/infrastructure/db/supabase-admin';

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function forgotPassword(formData: FormData) {
  const email = String(formData.get('recovery_email') || '').trim();

  if (!email || !email.includes('@')) {
    redirect(`/esqueci-senha?error=${encodeMessage('Informe um e-mail válido para recuperar a senha.')}`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${baseUrl}/auth/reset-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    redirect(`/esqueci-senha?error=${encodeMessage('Não foi possível gerar o link de recuperação.')}`);
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Balela Trunfo <onboarding@resend.dev>';

  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from,
      to: email,
      subject: 'Recuperação de senha - Balela Trunfo',
      text: [
        'Você solicitou a recuperação de senha.',
        '',
        'Clique no link abaixo para redefinir sua senha:',
        data.properties.action_link,
        '',
        'Se não foi você, ignore este e-mail.',
      ].join('\n'),
    });
  }

  await supabaseAdmin.from('audit_logs').insert({
    action: 'PASSWORD_RECOVERY_REQUEST',
    description: { email },
  });

  redirect(`/esqueci-senha?success=${encodeMessage('Enviamos o link de recuperação para o seu e-mail.')}`);
}
