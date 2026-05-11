'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/presentation/components/ui/Button';

function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDiscord(value: string) {
  return value.replace(/\s/g, '').slice(0, 32);
}

export default function RecrutamentoPage() {
  const [nomeApelido, setNomeApelido] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [discord, setDiscord] = useState('');
  const [comoConheceu, setComoConheceu] = useState('');
  const [porQueEntrar, setPorQueEntrar] = useState('');
  const [comoPodeAjudar, setComoPodeAjudar] = useState('');
  const [areaInteresse, setAreaInteresse] = useState('');
  const [disponibilidade, setDisponibilidade] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage('');

    try {
      const res = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeApelido,
          email,
          whatsapp,
          discord,
          comoConheceu,
          porQueEntrar,
          comoPodeAjudar,
          areaInteresse,
          disponibilidade,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || 'Falha ao enviar');

      setMessage('Inscricao enviada com sucesso!');
      setNomeApelido('');
      setEmail('');
      setWhatsapp('');
      setDiscord('');
      setComoConheceu('');
      setPorQueEntrar('');
      setComoPodeAjudar('');
      setAreaInteresse('');
      setDisponibilidade('');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Erro inesperado';
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: '760px', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', fontFamily: 'var(--font-outfit)', textAlign: 'center' }}>Faça Parte do Time</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>
        Junte-se à equipe do Season Pass Balela e ajude o projeto a crescer!
      </p>

      <div
        style={{
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid var(--purple-primary)',
          borderRadius: '10px',
          padding: '0.9rem 1rem',
          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          fontSize: '0.95rem',
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>Aviso:</strong> Este é um projeto de <strong>fã para fã</strong>. Não fazemos parte da equipe oficial do Balela, mas temos autorização para realizar este projeto de forma independente e sem fins lucrativos.
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-secondary)', boxShadow: '0 14px 30px rgba(0,0,0,0.08)' }}>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Nome / Apelido</span>
          <input className="input" value={nomeApelido} onChange={(e) => setNomeApelido(e.target.value)} required minLength={2} placeholder="Ex: Jéssica 'Jess' Oliveira" />
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Ex: seuemail@exemplo.com" />
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Whatsapp</span>
          <input
            className="input"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
            required
            minLength={14}
            maxLength={15}
            inputMode="numeric"
            placeholder="Ex: (11) 98765-4321"
          />
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Discord</span>
          <input
            className="input"
            value={discord}
            onChange={(e) => setDiscord(formatDiscord(e.target.value))}
            required
            minLength={2}
            placeholder="Ex: usuario ou usuario#1234"
          />
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Como conheceu o projeto?</span>
          <select className="select" value={comoConheceu} onChange={(e) => setComoConheceu(e.target.value)} required>
            <option value="">Selecione...</option>
            <option value="Estava na gravacao do circo">Estava na gravação do circo</option>
            <option value="Estava na gravacao da banda de rock">Estava na gravação da banda de rock</option>
            <option value="Pelo grupo de membros">Pelo grupo de membros</option>
            <option value="Pelo video de bastidores">Pelo video de bastidores</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Por que quer entrar no projeto?</span>
          <textarea
            value={porQueEntrar}
            onChange={(e) => setPorQueEntrar(e.target.value)}
            required
            minLength={20}
            placeholder="Conte sua motivação, conexão com o projeto e o que te anima em participar."
            style={{ minHeight: '140px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Como pode ajudar?</span>
          <textarea
            value={comoPodeAjudar}
            onChange={(e) => setComoPodeAjudar(e.target.value)}
            required
            minLength={20}
            placeholder="Descreva suas habilidades e como você pode contribuir de forma prática."
            style={{ minHeight: '140px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Area de interesse</span>
          <input className="input" value={areaInteresse} onChange={(e) => setAreaInteresse(e.target.value)} required minLength={2} placeholder="Ex: Edição, Social Media, Design, Produção" />
        </label>

        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span>Disponibilidade</span>
          <input className="input" value={disponibilidade} onChange={(e) => setDisponibilidade(e.target.value)} required minLength={2} placeholder="Ex: Noites de semana e sábados" />
        </label>

        <Button type="submit" disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar inscricao'}
        </Button>

        {message && (
          <p style={{ color: message.includes('sucesso') ? 'var(--success)' : 'var(--error)' }}>{message}</p>
        )}
      </form>
    </main>
  );
}
