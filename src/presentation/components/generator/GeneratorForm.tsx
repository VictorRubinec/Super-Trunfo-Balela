'use client';

import { useGeneratorStore } from '@/store/generatorStore';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../ui/Toast';

export function GeneratorForm() {
  const { cardData, updateCardData, updateAtributos } = useGeneratorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedId = localStorage.getItem('current_card_id');
      if (storedId) setEditingId(storedId);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      updateCardData({
        foto: ev.target?.result as string,
        foto_arquivo: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    updateCardData({ foto: '', foto_arquivo: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="form-panel glass-panel">
      <h2 className="panel-title">Nova Carta</h2>

      <form className="card-form" onSubmit={(e) => e.preventDefault()}>
        {/* 1. TÍTULO */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Título</label>
          <input
            className="input"
            type="text"
            placeholder="Ex: CALANGO PUNK"
            maxLength={40}
            value={cardData.titulo}
            onChange={(e) => updateCardData({ titulo: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>

        {/* 2. COR TEMA */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Cor Tema</label>
          <input
            className="input"
            type="color"
            value={cardData.cor}
            onChange={(e) => updateCardData({ cor: e.target.value })}
            style={{ width: '60px', height: '40px', padding: '4px', cursor: 'pointer', border: '1px solid var(--border-color)' }}
          />
        </div>

        {/* 3. IMAGEM */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Imagem</label>
          {!cardData.foto ? (
            <label className="upload-area" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '24px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', background: 'var(--bg-primary)', transition: 'all 0.2s'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                <polyline points="16 16 12 12 8 16"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Selecionar Foto</span>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </label>
          ) : (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img src={cardData.foto} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'contain', background: '#000' }} />
              <button
                type="button"
                onClick={removePhoto}
                style={{
                  position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff',
                  border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 4. MODELO */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" htmlFor="field-modelo" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Modelo da Carta</label>
          <select
            id="field-modelo"
            className="select"
            value={cardData.modelo}
            onChange={(e) => updateCardData({ modelo: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="v1">Comum</option>
            <option value="v4">FullArt</option>
            <option value="v6">Video</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tipo</label>
          <select
            className="select"
            value={cardData.tipo}
            onChange={(e) => updateCardData({ tipo: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="" disabled hidden>Selecionar um Tipo...</option>
            <option value="Video">Video</option>
            <option value="Baleler">Baleler</option>
            <option value="Produção">Produção</option>
            <option value="Professor">Professor</option>
            <option value="Convidado">Convidado</option>
            <option value="Momento">Momento</option>
          </select>
        </div>

        {/* 6. ATRIBUTOS */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <span className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Atributos</span>
          <div className="attributes-grid">
            <Slider label="Entretenimento" value={cardData.atributos.entretenimento} onChange={(e) => updateAtributos({ entretenimento: parseInt(e.target.value) })} />
            <Slider label="Vergonha Alheia" value={cardData.atributos.vergonha_alheia} onChange={(e) => updateAtributos({ vergonha_alheia: parseInt(e.target.value) })} />
            <Slider label="Competência" value={cardData.atributos.competencia} onChange={(e) => updateAtributos({ competencia: parseInt(e.target.value) })} />
            <Slider label="Balela" value={cardData.atributos.balela} onChange={(e) => updateAtributos({ balela: parseInt(e.target.value) })} />
            <Slider label="Climão" value={cardData.atributos.climao} onChange={(e) => updateAtributos({ climao: parseInt(e.target.value) })} />
          </div>
        </div>

        {/* 7. FRASE */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Frase Marcante</label>
          <input
            className="input"
            type="text"
            placeholder='Ex: "ANARQUISMO!"'
            maxLength={80}
            value={cardData.frase}
            onChange={(e) => updateCardData({ frase: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>

        {/* 8. PACOTE */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Pacote / Coleção</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="select"
              value={cardData.video_origem}
              onChange={(e) => updateCardData({ video_origem: e.target.value })}
              style={{ flex: 1 }}
            >
              <option value="">Selecione um pacote...</option>
              <option value="Pacote Básico">Pacote Básico</option>
              <option value="Season Pass">Season Pass</option>
            </select>
            <Button variant="outline" size="sm" type="button" title="Gerenciar pacotes">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </Button>
          </div>
        </div>

        <Button
          variant="solid"
          style={{ width: '100%' }}
          type="submit"
          disabled={isSaving}
          onClick={async (e) => {
            e.preventDefault();
            if (isSaving) return;

            setIsSaving(true);
            try {
              const payload = {
                ...cardData,
                atributos: cardData.atributos,
              };

              const res = await fetch(
                editingId ? `/api/cards/${editingId}` : '/api/cards',
                {
                  method: editingId ? 'PUT' : 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                }
              );

              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || 'Falha ao salvar carta');

              if (!editingId && data?.id) {
                localStorage.setItem('current_card_id', data.id);
                setEditingId(data.id);
              }

              showToast('Carta salva com sucesso!', 'success');
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Erro ao salvar carta';
              showToast(message, 'error');
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>{isSaving ? 'Salvando...' : 'Salvar Carta'}</span>
        </Button>
      </form>
    </div>
  );
}
