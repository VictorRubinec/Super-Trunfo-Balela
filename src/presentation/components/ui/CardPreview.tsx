'use client'

import { useEffect, useRef } from 'react'

// Import dinâmico dos Web Components apenas no lado do cliente
if (typeof window !== 'undefined') {
  import('@/presentation/web-components/BalelaCardV1')
  import('@/presentation/web-components/BalelaCardV4')
  import('@/presentation/web-components/BalelaCardV6')
  import('@/presentation/web-components/BalelaCardBack')
}

interface CardData {
  titulo: string
  tipo: string
  frase: string
  cor: string
  foto?: string
  entretenimento: number
  vergonha_alheia: number
  competencia: number
  balela: number
  climao: number
  modelo: string
  zoom?: number
  pos_x?: number
  pos_y?: number
}

export function CardPreview({ data, showBack = false, scale = 1 }: { data: CardData, showBack?: boolean, scale?: number }) {
  const cardRef = useRef<any>(null)

  const renderCard = () => {
    if (showBack) {
      return <balela-card-back />
    }
    const props = {
      ref: cardRef,
      titulo: data.titulo,
      tipo: data.tipo,
      frase: data.frase,
      cor: data.cor,
      foto: data.foto,
      entretenimento: data.entretenimento.toString(),
      vergonha_alheia: data.vergonha_alheia.toString(),
      competencia: data.competencia.toString(),
      balela: data.balela.toString(),
      climao: data.climao.toString(),
      zoom: (data.zoom ?? 1).toString(),
      pos_x: (data.pos_x ?? 0).toString(),
      pos_y: (data.pos_y ?? 0).toString(),
    }

    switch (data.modelo) {
      case 'v4':
        return <balela-card-v4 {...props} />
      case 'v6':
        return <balela-card-v6 {...props} />
      case 'v1':
      default:
        return <balela-card-v1 {...props} />
    }
  }

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '450px',
      overflow: 'visible'
    }}>
      <div style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'center center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {renderCard()}
      </div>
    </div>
  )
}

// Declaração para o TypeScript reconhecer o Web Component no React 19
declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'balela-card-v1': BalelaCardProps;
      'balela-card-v4': BalelaCardProps;
      'balela-card-v6': BalelaCardProps;
      'balela-card-back': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface BalelaCardProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  titulo?: string;
  tipo?: string;
  frase?: string;
  cor?: string;
  foto?: string;
  entretenimento?: string;
  vergonha_alheia?: string;
  competencia?: string;
  balela?: string;
  climao?: string;
  zoom?: string;
  pos_x?: string;
  pos_y?: string;
}
