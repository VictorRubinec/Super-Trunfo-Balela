'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/infrastructure/db/supabase-client';
import { Button } from '@/presentation/components/ui/Button';
import './reset-password.css';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('Preencha os dois campos de senha.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw new Error(updateError.message || 'Falha ao redefinir senha.');
      }

      await fetch('/api/auth/password-reset-log', { method: 'POST' });
      setMessage('Senha redefinida com sucesso. Você já pode fazer login.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Erro inesperado';
      setError(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="auth-page">
      <form onSubmit={onSubmit} className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Redefinir senha</h1>
          <p className="auth-subtitle">Digite sua nova senha para concluir a recuperação.</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}
        {message && <div className="auth-alert success">{message}</div>}

        <label className="auth-field">
          <span className="auth-label">Nova senha</span>
          <input type="password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" />
        </label>

        <label className="auth-field">
          <span className="auth-label">Confirmar senha</span>
          <input type="password" placeholder="Confirme a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input" />
        </label>

        <Button type="submit" variant="solid" className="auth-submit" disabled={sending}>
          {sending ? 'Salvando...' : 'Salvar nova senha'}
        </Button>

        <Link href="/login" className="auth-link">Voltar para login</Link>
      </form>
    </main>
  );
}
