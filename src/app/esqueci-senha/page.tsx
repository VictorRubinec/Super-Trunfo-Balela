import Link from 'next/link';
import { forgotPassword } from './actions';
import './esqueci-senha.css';
import { Button } from '@/presentation/components/ui/Button';

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <form action={forgotPassword} className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Esqueci minha senha</h1>
          <p className="auth-subtitle">Informe seu e-mail para receber o link de recuperação.</p>
        </div>

        {params?.error && <div className="auth-alert error">{params.error}</div>}
        {params?.success && <div className="auth-alert success">{params.success}</div>}

        <label className="auth-field">
          <span className="auth-label">E-mail</span>
          <input name="recovery_email" type="email" placeholder="Digite seu e-mail de acesso" required className="input" />
        </label>

        <Button type="submit" variant="solid" className="auth-submit">
          Enviar link de recuperação
        </Button>

        <Link href="/login" className="auth-link">Voltar para login</Link>
      </form>
    </main>
  );
}
