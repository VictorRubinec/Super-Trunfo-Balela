import { NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/db/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se der erro, manda para uma página de erro genérica
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
