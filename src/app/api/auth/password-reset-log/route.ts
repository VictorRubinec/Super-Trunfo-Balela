import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/db/supabase-server';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 401 });
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      description: { email: user.email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
