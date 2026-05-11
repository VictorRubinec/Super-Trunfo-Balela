'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/infrastructure/db/supabase-client';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useGeneratorStore } from '@/store/generatorStore';

type CardListItem = {
  id: string;
  titulo: string;
  tipo: string;
  modelo: string;
  cor: string;
  foto: string;
  frase: string;
  video_origem: string;
  created_at?: string;
  user_id?: string;
};

type Role = 'admin' | 'member' | 'visitor';

export function CardsGallery() {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const { updateCardData } = useGeneratorStore();
  const [cards, setCards] = useState<CardListItem[]>([]);
  const [role, setRole] = useState<Role>('visitor');
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setUserId(user?.id ?? null);

      if (!user) {
        setRole('visitor');
        setCards([]);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      const userRole = (profile?.role as Role) || 'member';
      setRole(userRole);

      const res = await fetch('/api/cards');
      const list = await res.json();
      if (!res.ok) throw new Error(list?.error || 'Falha ao carregar cartas');
      setCards(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar cartas';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCards();
    }, 0);
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void loadCards();
    });
    return () => {
      clearTimeout(timer);
      subscription.subscription.unsubscribe();
    };
  }, [loadCards, supabase]);

  const canEdit = (card: CardListItem) => role === 'admin' || card.user_id === userId;
  const canDelete = (card: CardListItem) => role !== 'visitor' && (role === 'admin' || card.user_id === userId);

  const handleSelect = (card: CardListItem) => {
    updateCardData({
      titulo: card.titulo,
      tipo: card.tipo,
      cor: card.cor,
      modelo: card.modelo,
      frase: card.frase,
      video_origem: card.video_origem,
      foto: card.foto,
    });
    localStorage.setItem('current_card_id', card.id);
    showToast('Carta carregada no editor.', 'success');
  };

  const handleDelete = async (card: CardListItem) => {
    if (!canDelete(card)) return;
    const confirmed = window.confirm(`Excluir a carta "${card.titulo}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Falha ao excluir carta');
      }
      showToast('Carta excluida.', 'success');
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir carta';
      showToast(message, 'error');
    }
  };

  return (
    <section className="cards-gallery">
      <div className="cards-gallery-header">
        <div>
          <h2>Cartas Criadas</h2>
          <span>{cards.length} cartas</span>
        </div>
        <div className="cards-gallery-actions">
          <div className="view-toggles">
            <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Grade">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="Lista">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="cards-gallery-loading">Carregando cartas...</p>}
      {!loading && cards.length === 0 && <p className="cards-gallery-empty">Nenhuma carta criada ainda.</p>}

      <div className={`cards-gallery-grid ${view}`}>
        {cards.map((card) => (
          <article key={card.id} className="cards-gallery-item">
            <div className="card-thumb" style={{ backgroundColor: card.cor || 'var(--bg-secondary)' }}>
              {card.foto ? <img src={card.foto} alt={card.titulo} /> : <span>Sem foto</span>}
            </div>
            <div className="card-meta">
              <div>
                <strong>{card.titulo}</strong>
                <span>{card.tipo}</span>
                <small>{card.video_origem || 'Sem pacote'}</small>
              </div>
              <div className="card-actions">
                <Button variant="outline" size="sm" onClick={() => handleSelect(card)}>
                  {canEdit(card) ? 'Editar' : 'Ver'}
                </Button>
                {canDelete(card) && (
                  <Button variant="solid" size="sm" onClick={() => handleDelete(card)}>
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
