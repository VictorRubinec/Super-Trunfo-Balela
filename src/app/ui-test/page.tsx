'use client'

import { useState } from 'react'
import { Button } from '@/presentation/components/ui/Button'
import { Input, Select } from '@/presentation/components/ui/FormFields'
import { Slider } from '@/presentation/components/ui/Slider'
import { Modal } from '@/presentation/components/ui/Modal'
import { useToast } from '@/presentation/components/ui/Toast'
import { CardPreview } from '@/presentation/components/ui/CardPreview'

export default function UITestPage() {
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sliderVal, setSliderVal] = useState(5)

  const mockCard = {
    titulo: 'O Grande Baleler',
    tipo: 'Lendário',
    frase: 'Isso aqui é apenas um teste visual!',
    cor: '#7c3aed',
    foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    entretenimento: 8,
    vergonha_alheia: 3,
    competencia: 9,
    balela: 10,
    climao: 2,
    modelo: 'v1'
  }

  return (
    <main className="container" style={{ padding: '4rem 2rem' }}>
      <header style={{ marginBottom: '4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--purple-primary)' }}>UI KITCHEN SINK</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Guia de estilos e componentes do Balela Trunfo v2.0</p>
      </header>

      {/* --- BOTÕES --- */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '2rem', textTransform: 'uppercase', fontSize: '1.2rem' }}>Botões (Variants)</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="solid">Botão Sólido</Button>
          <Button variant="outline">Botão Outline</Button>
          <Button variant="icon" title="Exemplo de Ícone">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </Button>
          <Button variant="solid" onClick={() => showToast('Notificação de Sucesso!', 'success')}>Disparar Toast</Button>
        </div>
      </section>

      {/* --- FORMULÁRIOS --- */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '2rem', textTransform: 'uppercase', fontSize: '1.2rem' }}>Formulários e Inputs</h2>
        <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input label="Campo de Texto" placeholder="Digite algo..." />
          <Select 
            label="Seleção" 
            options={[
              { value: '1', label: 'Opção 1' },
              { value: '2', label: 'Opção 2' }
            ]} 
          />
          <Slider 
            label="Nível de Balela" 
            value={sliderVal} 
            onChange={(e) => setSliderVal(parseInt(e.target.value))} 
          />
        </div>
      </section>

      {/* --- MODAL --- */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '2rem', textTransform: 'uppercase', fontSize: '1.2rem' }}>Interações (Modais)</h2>
        <Button variant="outline" onClick={() => setIsModalOpen(true)}>Abrir Modal de Exemplo</Button>
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Teste de Modal"
        >
          <p>Este é o conteúdo do nosso modal seguindo o design system.</p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </div>
        </Modal>
      </section>

      {/* --- CARTAS --- */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '2rem', textTransform: 'uppercase', fontSize: '1.2rem' }}>Modelos de Cartas (Web Components)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--purple-primary)' }}>Modelo V1 (Cristal)</h3>
            <CardPreview data={{ ...mockCard, modelo: 'v1' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--purple-primary)' }}>Modelo V4 (FullArt)</h3>
            <CardPreview data={{ ...mockCard, modelo: 'v4' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--purple-primary)' }}>Modelo V6 (Showcase)</h3>
            <CardPreview data={{ ...mockCard, modelo: 'v6' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--purple-primary)' }}>Verso da Carta</h3>
            <CardPreview data={mockCard} showBack={true} />
          </div>
        </div>
      </section>
    </main>
  )
}
