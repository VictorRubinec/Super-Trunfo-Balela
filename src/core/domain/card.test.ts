import { describe, it, expect } from 'vitest'

describe('Smoke Test - Domínio de Cartas', () => {
  it('deve validar que a lógica básica de teste está funcionando (1+1=2)', () => {
    const sum = 1 + 1
    expect(sum).toBe(2)
  })

  it('deve verificar se o ambiente de teste reconhece objetos globais', () => {
    expect(typeof window).not.toBe('undefined')
  })
})
