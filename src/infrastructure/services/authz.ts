import { createClient } from '@/infrastructure/db/supabase-server';

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: 'Não autorizado' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Acesso restrito a administradores' };
  }

  return { ok: true as const, userId: user.id, supabase };
}
