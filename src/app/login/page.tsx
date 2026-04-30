import { login } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <form 
        action={login} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          padding: '2.5rem', 
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ color: 'var(--purple-primary)', fontSize: '1.8rem' }}>Acesso Restrito</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Entre com suas credenciais de Admin ou Membro</p>
        </div>

        {searchParams?.error && (
          <div style={{ 
            padding: '0.8rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--error)', 
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {searchParams.error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>E-mail</label>
          <input 
            name="email" 
            type="email" 
            placeholder="seu@email.com" 
            required 
            style={{ 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Senha</label>
          <input 
            name="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            style={{ 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }} 
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            padding: '0.8rem', 
            backgroundColor: 'var(--purple-primary)', 
            color: 'white', 
            border: 'none', 
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '1rem',
            marginTop: '0.5rem'
          }}
        >
          Entrar no Painel
        </button>

        <a href="/" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Voltar para a Home
        </a>
      </form>
    </main>
  )
}
