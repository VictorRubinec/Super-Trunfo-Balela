'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/db/supabase-server';

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !password) {
    redirect(`/login?error=${encodeMessage('Preencha e-mail e senha.')}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeMessage('E-mail ou senha inválidos.')}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
