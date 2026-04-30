import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock simples para o Supabase (evita erros em testes que não o usam diretamente)
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
}))

// Mock para o window.matchMedia (comum em testes de tema/responsividade)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // depreciado
    removeListener: vi.fn(), // depreciado
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
