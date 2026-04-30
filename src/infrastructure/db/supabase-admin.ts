import { createClient } from '@supabase/supabase-js'

/**
 * Cliente administrativo do Supabase.
 * Apenas para uso em rotas de API ou Server Actions que exigem bypass do RLS.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
