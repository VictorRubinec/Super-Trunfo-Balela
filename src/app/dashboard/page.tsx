import { createClient } from '@/infrastructure/db/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ color: 'var(--purple-primary)' }}>Dashboard</h1>
      <p>Bem-vindo, {user.email}</p>
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed var(--border-color)' }}>
        <p>Esta é a fundação da sua área administrativa.</p>
      </div>
      <form action="/auth/signout" method="post" style={{ marginTop: '2rem' }}>
        <button type="submit" style={{ color: 'var(--error)', background: 'none', border: 'none', textDecoration: 'underline' }}>
          Sair do sistema
        </button>
      </form>
    </main>
  )
}
