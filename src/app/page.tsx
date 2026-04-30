import { Button } from "@/presentation/components/ui/Button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            SEASON PASS <span>BALELA</span>
          </h1>
          <p className="hero-description">
            Um projeto de fidelidade criado de fã para fã. Colecione prêmios 
            exclusivos e cartas de Super Trunfo a cada gravação que você comparecer.
          </p>
          
          <Link href="/gerador">
            <Button style={{ padding: '1rem 2rem', gap: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              VER GERADOR DE CARTAS
            </Button>
          </Link>
        </div>

        <div className="hero-image-container">
          <div className="sticker-box">
            {/* Simulando os adesivos da imagem de referência */}
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  backgroundColor: `hsl(${i * 30}, 70%, 60%)`,
                  border: '4px solid #eee',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }} 
              />
            ))}
            <div style={{
              gridColumn: 'span 2',
              gridRow: 'span 2',
              backgroundColor: '#eee',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              color: '#999',
              fontWeight: 'bold'
            }}>
              STILL IMAGE
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase' }}>
          RECOMPENSAS DO SEASON PASS
        </h2>
      </section>
    </main>
  );
}
