# Checklist de Evolução: Season Pass Balela

## Fase 1: Setup e Design System
- [x] Criar branch `feature/evolucao-projeto`
- [x] Definir variáveis de cores sólidas no `:root` do `style.css`
- [x] Instalar/Configurar biblioteca Lucide Icons
- [x] Criar Navbar global responsiva (sem emojis)
- [x] Criar placeholders para imagens de prêmios

## Fase 2: Reestruturação e Home
- [x] Renomear `index.html` para `gerador.html`
- [x] Criar nova `index.html` (Home)
    - [x] Implementar Seção Hero
    - [x] Implementar Timeline do Season Pass (10 prêmios)
    - [x] Implementar Seção "Inspiradores" (Calango, Zero, Caio) com o texto de Victor
- [x] Aplicar novo design "Solid Flat" na Home

## Fase 3: Sobre Nós e Equipe
- [x] Criar `sobre.html`
- [x] Implementar grid de membros da equipe
- [x] Adicionar perfil inicial do Victor (Cargo, Bio, Links)
- [x] Criar template para futuros membros
- [x] Criar `galeria.html` standalone para exibição de todas as cartas

## Fase 4: Funcionalidades e Backend
- [x] Implementar botão "Baixar Carta (PNG)" no gerador
- [x] Testar exportação com fundo transparente (html2canvas)
- [x] Configurar serviço de email no `server/services/emailService.js` usando Resend
- [x] Substituir envios de email antigos pelo novo sistema

## Fase 5: Finalização
- [x] Revisar consistência visual em todas as páginas
- [x] Adicionar meta tags SEO finais
- [x] Testar todos os links e navegação mobile
- [x] Preparar resumo final do projeto
