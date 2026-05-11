'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SelectionTree } from './SelectionTree';
import { usePrintStore } from '@/store/printStore';
import { ICard } from '@/core/domain/Card';
import { PageFormat } from '@/core/domain/Export';
import './print.css';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_CAPACITY: Record<PageFormat, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  'super-a4': { w: 225, h: 320 },
  a3: { w: 297, h: 420 },
  'super-a3': { w: 320, h: 450 },
};

const CARD_W = 63;
const CARD_H = 88;

const CustomNumberInput = ({ value, onChange, disabled = false, step = 0.5 }: { value: number; onChange: (val: number) => void; disabled?: boolean; step?: number }) => (
  <div className="custom-number-input">
    <button className="num-btn" disabled={disabled} onClick={() => onChange(Math.max(0, value - step))}>-</button>
    <input type="number" className="input" value={value} disabled={disabled} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
    <button className="num-btn" disabled={disabled} onClick={() => onChange(value + step)}>+</button>
  </div>
);

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose }) => {
  const [cards, setCards] = useState<ICard[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  const { selectedCards, packageMultipliers, settings, updateSettings } = usePrintStore();

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/cards')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCards(data);
      })
      .catch((err) => console.error('Erro ao carregar cartas para impressão:', err));
  }, [isOpen]);

  const techSummary = useMemo(() => {
    const fmt = PAGE_CAPACITY[settings.format];
    const bleed = settings.useBleed ? settings.bleed : 0;
    const margin = settings.margin;
    const availW = fmt.w - margin * 2;
    const availH = fmt.h - margin * 2;
    const cellW = CARD_W + bleed * 2;
    const cellH = CARD_H + bleed * 2;
    const perPage = Math.max(0, Math.max(Math.floor(availW / cellW) * Math.floor(availH / cellH), Math.floor(availW / cellH) * Math.floor(availH / cellW)));

    let totalCardsSelected = 0;
    cards.forEach((card) => {
      if (!card.id) return;
      const state = selectedCards[card.id];
      if (!state?.selected) return;
      const pkg = card.video_origem || 'Sem Pacote';
      const mult = packageMultipliers[pkg] || 1;
      totalCardsSelected += state.quantity * mult;
    });

    const sheets = perPage > 0 ? Math.ceil(totalCardsSelected / perPage) : 0;
    return { totalCardsSelected, sheets, perPage, maxCapacity: sheets * perPage };
  }, [cards, selectedCards, packageMultipliers, settings]);

  const exportList = useMemo(() => {
    const list: ICard[] = [];
    cards.forEach((card) => {
      if (!card.id) return;
      const state = selectedCards[card.id];
      if (!state?.selected) return;
      const pkg = card.video_origem || 'Sem Pacote';
      const mult = packageMultipliers[pkg] || 1;
      const totalQty = state.quantity * mult;
      for (let i = 0; i < totalQty; i++) list.push(card);
    });
    return list;
  }, [cards, selectedCards, packageMultipliers]);

  const handleExport = async () => {
    if (exportList.length === 0) {
      alert('Selecione pelo menos uma carta.');
      return;
    }

    setIsExporting(true);
    setProgressMsg('Enviando job para o servidor...');
    setProgressPct(10);

    try {
      const createRes = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: exportList, settings }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData?.error || 'Falha ao iniciar exportação.');

      const jobId = createData.jobId as string;
      setProgressMsg('Renderizando PDFs no servidor...');
      setProgressPct(35);

      let done = false;
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const statusRes = await fetch(`/api/export/${jobId}`, { cache: 'no-store' });
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusData?.error || 'Falha ao consultar job.');
        if (statusData.status === 'failed') throw new Error(statusData.error || 'Job falhou.');
        if (statusData.status === 'done') {
          done = true;
          break;
        }
        setProgressPct(Math.min(90, 35 + i));
      }

      if (!done) throw new Error('Exportação excedeu o tempo esperado.');

      setProgressMsg('Baixando ZIP...');
      setProgressPct(95);
      const downloadRes = await fetch(`/api/export/${jobId}/download`);
      if (!downloadRes.ok) {
        const errorData = await downloadRes.json();
        throw new Error(errorData?.error || 'Falha ao baixar ZIP.');
      }

      const blob = await downloadRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${settings.projectName || 'Balela_Trunfo'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setProgressMsg('Concluído!');
      setProgressPct(100);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha na exportação';
      console.error('[Export Error]:', error);
      alert(`Falha na exportação: ${message}`);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setProgressPct(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciador de Impressão" maxWidth="1000px">
      <div className="print-modal-content">
        <aside className="print-sidebar">
          <div>
            <h3 className="print-section-title">Configurações</h3>
            <div className="config-group" style={{ marginBottom: '16px' }}>
              <label className="config-label">Formato</label>
              <select className="select" value={settings.format} onChange={(e) => updateSettings({ format: e.target.value as PageFormat })}>
                <option value="a4">A4 (210x297mm)</option>
                <option value="super-a4">Super A4 (225x320mm)</option>
                <option value="a3">A3 (297x420mm)</option>
                <option value="super-a3">Super A3 (320x450mm)</option>
              </select>
            </div>

            <div className="config-group" style={{ marginBottom: '12px' }}>
              <div className="config-row" style={{ justifyContent: 'space-between' }}>
                <label className="config-label">Margem da Folha (mm)</label>
                <CustomNumberInput value={settings.margin} onChange={(val) => updateSettings({ margin: val })} />
              </div>
            </div>

            <div className="config-group" style={{ marginBottom: '12px' }}>
              <div className="config-row" style={{ justifyContent: 'space-between' }}>
                <label className="config-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.useBleed} onChange={(e) => updateSettings({ useBleed: e.target.checked })} />
                  Sangria (mm)
                </label>
                <CustomNumberInput value={settings.bleed} disabled={!settings.useBleed} onChange={(val) => updateSettings({ bleed: val })} />
              </div>
            </div>

            <div className="config-group">
              <label className="config-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.cutmarks} onChange={(e) => updateSettings({ cutmarks: e.target.checked })} />
                Marcas de Corte (Crop Marks)
              </label>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <h3 className="print-section-title">Resumo Técnico</h3>
            <div className="tech-summary-box">
              <div className="tech-summary-item"><span className="tech-label">Cartas Selecionadas:</span><span className="tech-value">{techSummary.totalCardsSelected}</span></div>
              <div className="tech-summary-item"><span className="tech-label">Total de Folhas:</span><span className="tech-value highlight">{techSummary.sheets}</span></div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
              <div className="tech-summary-item"><span className="tech-label">Cartas por Folha:</span><span className="tech-value">{techSummary.perPage}</span></div>
              <div className="capacity-badge">Capacidade Máxima: {techSummary.maxCapacity} cartas</div>
            </div>

            <Button variant="solid" style={{ width: '100%', marginTop: '20px' }} onClick={handleExport} disabled={isExporting || techSummary.totalCardsSelected === 0}>
              {isExporting ? 'GERANDO ZIP...' : 'EXPORTAR PDF'}
            </Button>
          </div>
        </aside>

        <main className="print-main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="print-section-title" style={{ margin: 0 }}>Seleção de Cartas</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Título | Tipo | Modelo</span>
          </div>
          <SelectionTree cards={cards} />
        </main>
      </div>

      {isExporting && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', borderRadius: '12px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px', fontFamily: 'var(--font-outfit)', fontSize: '24px' }}>{progressMsg}</h3>
          <div style={{ width: '60%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--purple-primary), #b05af8)', width: `${progressPct}%`, transition: 'width 0.3s ease-out' }} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '10px' }}>{Math.round(progressPct)}%</span>
        </div>
      )}
    </Modal>
  );
};
