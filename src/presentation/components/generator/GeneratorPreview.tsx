'use client';

import { useGeneratorStore } from '@/store/generatorStore';
import { CardPreview } from '../ui/CardPreview';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { PrintModal } from './PrintModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/infrastructure/db/supabase-client';

export function GeneratorPreview() {
  const { cardData, showBack, toggleShowBack, updateCardData } = useGeneratorStore();
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<'admin' | 'member' | 'visitor' | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadRole = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!isMounted) return;

      if (!user) {
        setRole('visitor');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!isMounted) return;
      setRole((profile?.role as 'admin' | 'member' | 'visitor') || 'member');
    };

    void loadRole();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void loadRole();
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (showBack || !cardData.foto) return;
    setIsDragging(true);
    
    currentPos.current = { x: cardData.pos_x, y: cardData.pos_y };
    dragStart.current = {
      x: e.clientX - cardData.pos_x,
      y: e.clientY - cardData.pos_y
    };
    
    if (wrapperRef.current) wrapperRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    currentPos.current = { x: newX, y: newY };

    const card = wrapperRef.current?.querySelector('balela-card-v1, balela-card-v4, balela-card-v6');
    if (card) {
      card.setAttribute('pos_x', newX.toString());
      card.setAttribute('pos_y', newY.toString());
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    updateCardData({
      pos_x: currentPos.current.x,
      pos_y: currentPos.current.y
    });

    if (wrapperRef.current) wrapperRef.current.releasePointerCapture(e.pointerId);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPNG = async () => {
    if (!wrapperRef.current || isExporting) return;

    try {
      setIsExporting(true);
      
      const { domToPng } = await import('modern-screenshot');

      const cardElement = wrapperRef.current.querySelector('balela-card-v1, balela-card-v4, balela-card-v6, balela-card-back');
      const exportTarget = (cardElement || wrapperRef.current) as HTMLElement;

      const dataUrl = await domToPng(exportTarget, {
        scale: 3,
        backgroundColor: 'transparent',
        features: {
          copyScrollbar: false,
          removeControlCharacter: true,
        },
        onCloneNode: (cloned) => {
          if (cloned instanceof HTMLElement) {
            cloned.style.transform = 'none';
            cloned.style.margin = '0';
          }
        }
      });

      const link = document.createElement('a');
      link.download = `balela-card-${cardData.titulo || 'sem-nome'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao exportar PNG:', err);
      alert('Ops! Ocorreu um erro ao gerar a imagem. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    updateCardData({ zoom: 1, pos_x: 0, pos_y: 0 });
  };

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCardData({ zoom: parseFloat(e.target.value) });
  };

  return (
    <div className="preview-panel glass-panel sticky-mobile-preview" style={{ userSelect: 'none' }}>
      <div className="panel-header">
        <h2 className="panel-title">Preview</h2>
        <Button variant="solid" size="md" onClick={toggleShowBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Girar Carta
        </Button>
      </div>

      <div 
        className="preview-wrapper"
        ref={wrapperRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ 
          cursor: isDragging ? 'grabbing' : (cardData.foto && !showBack ? 'grab' : 'default'), 
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        <CardPreview 
          data={{
            ...cardData,
            entretenimento: cardData.atributos.entretenimento,
            vergonha_alheia: cardData.atributos.vergonha_alheia,
            competencia: cardData.atributos.competencia,
            balela: cardData.atributos.balela,
            climao: cardData.atributos.climao,
          }} 
          showBack={showBack} 
          scale={1.15}
        />
      </div>

      <div className="preview-controls">
        <Slider
          label="Zoom"
          min={0.5}
          max={2.5}
          step={0.05}
          value={cardData.zoom}
          onChange={handleZoom}
          displayValue={`${Math.round(cardData.zoom * 100)}%`}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
          <Button variant="outline" onClick={handleReset} style={{ width: '100%' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            RESETAR
          </Button>
          <Button 
            variant="solid" 
            onClick={handleDownloadPNG} 
            disabled={isExporting}
            style={{ width: '100%' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {isExporting ? 'GERANDO...' : 'BAIXAR PNG'}
          </Button>
        </div>

        {role === 'admin' && (
          <Button 
            variant="outline" 
            onClick={() => setIsPrintModalOpen(true)}
            style={{ width: '100%', marginTop: '10px', borderStyle: 'dashed' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            IMPRIMIR EM LOTE (PDF)
          </Button>
        )}
      </div>

      <PrintModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
      />
    </div>
  );
}
