'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import './layout.css'

export function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-brand-container">
          <span className="nav-brand">Balela Trunfo</span>
          <span className="nav-sub-brand">SEASON PASS</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            HOME
          </Link>
          <Link href="/gerador" className={`nav-link ${isActive('/gerador') ? 'active' : ''}`}>
            GERADOR
          </Link>
          <Link href="/galeria" className={`nav-link ${isActive('/galeria') ? 'active' : ''}`}>
            GALERIA
          </Link>
          <Link href="/sobre" className={`nav-link ${isActive('/sobre') ? 'active' : ''}`}>
            SOBRE
          </Link>
        </div>

        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/login" className="btn-enter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            ENTRAR
          </Link>
        </div>
      </div>
    </nav>
  )
}
