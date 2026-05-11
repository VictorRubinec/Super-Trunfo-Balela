import Link from 'next/link';
import { login } from './actions';
import './login.css';
import { Button } from '@/presentation/components/ui/Button';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <form action={login} className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Login</h1>
        </div>

        {params?.error && <div className="auth-alert error">{params.error}</div>}

        <label className="auth-field">
          <span className="auth-label">E-mail</span>
          <input name="email" type="email" placeholder="seu@email.com" required className="input" />
        </label>

        <label className="auth-field">
          <span className="auth-label">Senha</span>
          <input name="password" type="password" placeholder="••••••••" required className="input" />
        </label>

        <Button type="submit" variant="solid" className="auth-submit">
          Entrar
        </Button>

        <Link href="/esqueci-senha" className="auth-link">
          Esqueci minha senha
        </Link>
      </form>
    </main>
  );
}
