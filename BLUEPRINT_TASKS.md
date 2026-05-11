# Controle de Tarefas - Super Trunfo Balela (v2.0)

Este documento é o **Checklist Operacional e Arquitetural** para a Inteligência Artificial. Ele dita os passos em nível granular (nível de código e comando) para a migração Full-Stack do sistema antigo para o novo.
**Regra para a IA:** Ao executar um bloco, marque-o com `[x]`. Não pule etapas.

---

## 🟢 Fase 1: Fundação e Setup (Full-Stack Next.js)

### 1.1. Inicialização do Repositório
- [x] Rodar `npx create-next-app@latest . --typescript --eslint --app --no-tailwind --src-dir` (Garantindo que Tailwind não seja instalado).
- [x] Limpar o boilerplate padrão gerado pelo Next.js (limpar o `page.tsx` e deletar `page.module.css`).
- [x] Criar a estrutura base da Clean Architecture na pasta `src/`:
  - `src/core/domain` (Entidades e Interfaces)
  - `src/core/use-cases` (Regras de negócio isoladas)
  - `src/infrastructure/db` (Repositórios e integrações)
  - `src/infrastructure/services` (Serviços externos)
  - `src/presentation/components` (UI Kit global)

### 1.2. Design System Base (Vanilla CSS)
- [x] Criar/Resetar `src/app/globals.css` definindo o reset padrão.
- [x] Criar as variáveis globais (`:root` e `[data-theme='dark']`) para o Design "Solid Flat":
  - [x] Cores: Roxos principais, Backgrounds Clientes/Escuros, Cores de texto.
  - [x] Tipografia: Configurar via `next/font/google` (Inter/Outfit).
  - [x] Variáveis de bordas e transições padronizadas (Micro-interações).

### 1.3. Integração com Banco de Dados (Supabase)
- [x] Instalar as bibliotecas oficiais: `npm install @supabase/ssr @supabase/supabase-js`.
- [x] Criar as variáveis no arquivo `.env.local` baseado na Seção 1.6 da Arquitetura.
- [x] Criar os *clients* do Supabase (Browser, Server e Middleware) na pasta `src/infrastructure/db`.

### 1.4. Segurança e Autenticação
- [x] Criar a rota de API de callback do Supabase Auth (caso use Magic Links/Google).
- [x] Implementar a página de Login (`/login`) usando Server Actions para disparar autenticação.
- [x] Criar o `middleware.ts` na raiz do `src/` para interceptar requisições.
- [x] Adicionar lógica ao middleware para checar Sessão e o Role do Usuário (Admin/Member/Visitor), protegendo o `/dashboard`.

### 1.5. Configuração de QA e Qualidade
- [x] Instalar o Vitest e suas integrações. Criar `vitest.config.ts`.
- [x] Instalar o Playwright para testes E2E.
- [x] Deixar um teste dummy unitário de validação (ex: `1+1=2`) para garantir que o pipeline de teste roda com `npm test`.

---

## 🟡 Fase 2: UI Kit e Web Components (Design System)

### 2.1. Componentes de Estrutura Visual
- [x] Criar o componente `<Navbar />`: Implementar lógica responsiva (Hambúrguer no mobile) e o *Theme Toggle* (Claro/Escuro).
- [x] Criar o componente `<Footer />`.
- [x] Criar os Layouts raiz do Next.js englobando Navbar e Footer em toda a navegação (exceto painéis isolados).

### 2.2. UI Kit Base (Design Solid Flat)
- [x] Componente `<Button />`: Implementar as `props` `variant='solid' | 'outline' | 'icon'` com cores base roxas.
- [x] Componente `<Modal />`: Caixa de diálogo flutuante e focável.
- [x] Componente `<ToastProvider />`: Sistema nativo simples para disparar balões de sucesso/erro (ex: contexto React).
- [x] Componentes de Formulário: `<Input />`, `<Select />` e `<Slider />` (Crucial para o gerador, customizado em CSS puramente sem `<input type="range">` genérico).

### 2.3. Web Components (As Cartas)
- [x] Criar o *Custom Element* nativo `<balela-card-v1>` (Modelo Cristal). Recebe props para alterar cores dinâmicas via Shadow DOM ou scoped CSS.
- [x] Criar o `<balela-card-v4>` (Modelo FullArt Thumb).
- [x] Criar o `<balela-card-v6>` (Modelo Showcase Video).
- [x] Criar um wrapper/registry de react para encapsular esses Web Components e facilitar a renderização dinâmica (`<CardTemplateSelector />`).

### 2.4. Estado Global Local
- [x] Instalar Zustand (`npm install zustand`).
- [x] Criar `src/store/generatorStore.ts`: Definir atributos da carta ativa, tipo selecionado, cor tema, modelo e foto atual para o Editor de Cartas.

---

## 🟠 Fase 3: Domínio Core (O Gerador Mágico)

### 3.1. Clean Architecture Backend (API Serverless)
- [x] Entidades (`src/core/domain`): Criar interfaces `ICard`, `IPackage`.
- [x] Repositórios (`src/infrastructure`): Implementar `SupabaseCardRepository`.
- [x] Use Cases (`src/core/use-cases`): Criar `CreateCardUseCase` e `EditCardUseCase`.
- [x] Serverless API (`app/api/cards/route.ts`): Expor os endpoints seguros, validando tokens de Auth e repassando ao Use Case.

### 3.2. A Interface do Gerador (`/gerador`)
- [x] Montar Layout Grid do Editor: Painel esquerdo (Controles e Inputs), Painel Direito estático flutuante (Preview da Carta).
- [x] Integrar Painel Esquerdo com o Zustand. As alterações nos inputs alteram imediatamente os Web Components da direita.
- [x] Desenvolver Componente de Controle Avançado de Imagem (Upload FileReader nativo).
- [x] Implementar a lógica de PAN (Drag) e Zoom in/out via CSS `transform` na foto carregada dentro da carta.
- [x] Teste Unitário QA (Vitest): Testar arquivo de validação que impede inputs `> 10` ou `< 1` nos atributos da carta.

### 3.3. Exportação Nativa e Motor PDF (EM ANDAMENTO)
- [x] Geração Front-end (PNG Público): Instalar `html2canvas-pro` (ou `dom-to-image`) e atrelar a um botão `export-png` chamando método local via Blob URL.
- [x] UI do Gerenciador de Impressão: Criar `PrintModal`, `SelectionTree` e `PrintStore` para seleção em lote.
- [x] Lógica de Aproveitamento: Implementar cálculo de grid (cartas por folha) dinâmico baseado em margem e sangria.
- [x] Backend: Criar Rota `app/api/export/route.ts` para orquestrar a geração.
- [x] Backend: Implementar pipeline oficial server-side para PDF profissional (Opção A).
- [x] Backend: Lógica de verso espelhado (Mirroring) para impressão frente e verso correta.
- [x] ZIP Engine: Integrar `jszip` para compactar PDFs de frentes e versos em um único download.
- [x] API assíncrona: Criar `GET /api/export/:jobId` e `GET /api/export/:jobId/download`.
- [x] Teste E2E QA (Playwright): Simular clique em "Download PNG" e checar download efetuado.

---

## 🔵 Fase 4: Integrações e Comunidade

### 4.1. Comunicação via E-mail
- [x] Instalar SDK do Resend (`npm install resend`).
- [x] Infra: Criar `src/infrastructure/services/ResendEmailService.ts`.
- [x] API Serverless: Criar endpoint `/api/recruitment` que valida dados e dispara um e-mail interno para os administradores, além de inserir log no Supabase.
- [x] Frontend: Criar o Formulário de Inscrição em `/recrutamento`.

### 4.2. Galeria Drive (Sincronização Server-to-Server)
- [x] Instalar `googleapis`.
- [x] Infra: Criar `src/infrastructure/services/GoogleDriveService.ts` implementando JWT auth server-to-server (`googleapis.auth.GoogleAuth`).
- [x] Backend Serverless: Construir `/api/gallery` com lógicas de Listagem, Paginação Básica e Cache do Drive.

### 4.3. Fronteira da Comunidade e Caching
- [x] Frontend: Montar a Página `/galeria` consumindo a API.
- [x] Backend: Criar Server Action Protegida por Admin `approveGalleryPhoto(id)`.
- [x] Backend: Adicionar `revalidatePath('/galeria')` na Server Action acima (Estratégia de On-Demand Revalidation).

---

## 🟣 Fase 5: Moderação Admin e Deploy

### 5.1. Dashboard Restrito (`/dashboard`)
- [ ] Criar sub-layout focado em dados e painéis gerenciais.
- [ ] Implementar painel de Gestão de Usuários (listar, editar permissões/Roles, banir conta).
- [ ] Implementar tela de Auditoria simples (`audit_logs`) para o Admin ver "Quem fez o que".
- [ ] Implementar gestão de Aprovação da Galeria.

### 5.2. Qualidade Final (QA) e Deploy
- [ ] QA: Rodar Teste E2E (Playwright) focando em segurança de RBAC na pasta `/dashboard`.
- [ ] Cadastrar as chaves `.env.local` de forma segura no painel Web da Vercel (`Settings > Environment Variables`).
- [ ] Fazer o Deploy de Produção via comando nativo ou Push na branch `main`.
- [ ] Rodar auditoria no gerador de PDF pela Vercel e ajustar limites de tempo/memória (`maxDuration` das API Routes) se o Puppeteer estourar tempo.
