# BLUEPRINT ARQUITETURA - Super Trunfo Balela (v2.0)

Este documento serve como o guia mestre definitivo para a reconstrução do projeto Super Trunfo Balela. A nova arquitetura visa resolver as deficiências do sistema legado, adotando Clean Architecture no Backend e React + Web Components no Frontend para garantir escalabilidade, manutenibilidade e isolamento de responsabilidades.

---

## 1. Visão Geral do Sistema (As-Is vs To-Be)

### As-Is (Estado Atual)
O sistema atual é um monólito acoplado construído com Node.js (Express) e frontend em Vanilla HTML/CSS/JS.
- **Backend:** Rotas e lógicas de negócios se misturam com infraestrutura em `/server/routes` e `/server/services`. Serviços lidam diretamente com Express, APIs externas (Google Drive, Supabase) e geração de PDFs (Puppeteer/Canvas) sem uma camada de abstração clara.
- **Frontend:** O controle de estado é feito no DOM ou em variáveis globais espalhadas por arquivos (ex: `app.js`, `dashboard.js`, `galeria.js`). A renderização das cartas (modelos visuais) está engessada e não padronizada, com lógica de template misturada com manipulação direta do DOM.
- **Deficiências:** Alta dificuldade de testar (acoplamento forte), duplicação de lógica, dificuldade de gerenciar as diferentes versões/modelos de cartas e problemas de performance na geração em massa de PDFs.

### To-Be (Estado Futuro)
- **Proposta de Valor:** Um sistema modular, independente de framework nas regras de negócio (Backend) e isolado na renderização visual (Frontend). 
- **Backend (Node.js + Clean Architecture):** Separação rigorosa de responsabilidades. O core da aplicação ditará as regras. O banco de dados (Supabase) e os serviços externos (Google Drive, SendGrid) serão apenas "plugins".
- **Frontend (React + Web Components):** A aplicação será gerenciada em React para melhor reatividade e estado. As cartas serão empacotadas como Custom Elements (Web Components nativos), o que significa que um modelo `<balela-card-v1>` será agnóstico, podendo ser injetado facilmente tanto na tela do usuário quanto no motor do backend/PDF.

---

## 1.5. Tech Stack Global e Arquitetura

A arquitetura do projeto divide responsabilidades de forma clara entre o Client (Navegador), o Servidor e os Serviços Gerenciados, priorizando baixo acoplamento.

### Visão Macro da Arquitetura
1. **Frontend (SPA):** Aplicação Single-Page que fornece navegação rápida e sem recarregamentos. Responsável pela interação do usuário e adoção do Design System "Solid Flat" (Base Roxa).
2. **Web Components (Shared):** Peça central do projeto. Os modelos de cartas (`<balela-card-v1>`, etc.) são Custom Elements nativos em HTML/CSS. Eles são **compartilhados** entre o Frontend (para o Preview em tempo real) e o Backend (para renderização de PDF), garantindo paridade visual absoluta.
3. **Backend Serverless (Next.js API Routes):** Como todo o projeto será hospedado na **Vercel**, não usaremos um servidor Node.js/Express isolado. Toda a lógica de backend (validações, comunicação com Supabase e Drive) rodará nativamente nas Serverless Functions do próprio Next.js (`app/api/...`), mantendo a *Clean Architecture* internamente.
4. **BaaS (Backend as a Service):** Supabase provendo os motores de Autenticação, Banco de Dados (Postgres) e Armazenamento em Nuvem.
5. **Integrações Externas:** Integração via Server-to-Server com o Google Drive para puxar dados da Galeria dinamicamente sem expor tokens no frontend.

### Tabela de Ferramentas, Tecnologias e Linguagens

| Camada | Tecnologia / Ferramenta | Propósito Arquitetural |
| :--- | :--- | :--- |
| **Linguagem Base** | TypeScript | Linguagem estritamente tipada e padronizada para garantir estabilidade no ecossistema (Full-Stack). |
| **Frontend Framework** | Next.js (React) | Criação das páginas (App Router), roteamento nativo e Server Components otimizados para SEO. |
| **Gerenciamento de Estado**| Zustand | Gerenciamento do estado global do front (ex: dados do Gerador de Cartas), por ser extremamente leve e performático. |
| **Estilização UI** | Vanilla CSS (`index.css`) | Design "Solid Flat", variáveis de cor globais (`:root`), Tema Claro/Escuro livre de dependências pesadas. |
| **Isolamento Visual** | Web Components | Garantir que a renderização da carta não fique engessada ao React, permitindo reuso livre. |
| **Backend Core & Deploy** | Vercel Serverless (Next.js API) | Substitui o Express. As rotas backend rodam como funções Serverless diretamente na infraestrutura da Vercel. |
| **Comunicação API** | Fetch Nativo / Server Actions | Otimização máxima dispensando libs pesadas como Axios, usando cache e chamadas diretas do Next.js. |
| **Motor de Exportação** | `puppeteer-core` + Chromium | Instancia Web Components escondidos no backend Serverless para "fotografar" cartas e gerar PDFs. |
| **Banco de Dados** | Supabase (PostgreSQL) | Armazenamento persistente e relacional (`cards`, `profiles`, `packages`). |
| **Autenticação e RBAC**| Supabase Auth | Gerenciamento seguro de logins, sessões JWT e restrição de acesso por cargos. |
| **Storage (Arquivos)** | Supabase Storage | Hospedagem estática das imagens (fotos enviadas no gerador e avatares do painel). |
| **Nuvem Comunitária** | API do Google Drive | Sincronização de pastas e moderação de fotos da comunidade. |
| **Envio de E-mails** | Resend | Disparo transacional de convites para novos usuários e notificações do sistema. |

### 1.6. Variáveis de Ambiente (.env)

Como a aplicação será Full-Stack com Next.js na Vercel, a segurança das credenciais é rigorosa. Chaves que o Frontend precisa acessar devem usar o prefixo `NEXT_PUBLIC_`, enquanto os segredos reais vivem apenas no Backend (API Routes).

O ecossistema exigirá as seguintes variáveis fundamentais configuradas na nuvem:

**Variáveis Públicas (Frontend - Visíveis no Navegador):**
- `NEXT_PUBLIC_SUPABASE_URL`: A URL pública de comunicação com o Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública para requisições básicas do cliente (como Login, Fetch de arquivos públicos e inserções simples no DB respeitando o RLS).
- `NEXT_PUBLIC_BASE_URL`: URL oficial em produção (útil para links e SEO metatags).

**Variáveis Privadas (Backend Serverless - Ocultas com Segurança):**
- `SUPABASE_SERVICE_ROLE_KEY`: A chave mestre do banco de dados (que ignora as políticas de segurança RLS). Usada estritamente pelas API Routes para forçar ações de Admin (ex: promover usuário, alterar buckets).
- `RESEND_API_KEY`: Token da API do Resend para realizar o disparo transacional de convites e alertas.
- **Integração Google Drive (Server-to-Server):**
  - `DRIVE_FOLDER_ID`: O ID da pasta raiz onde as fotos das galerias vivem.
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: Credenciais do Google Cloud OAuth2. Usadas nos bastidores da Vercel para gerar conexões seguras e renovar o token automaticamente sem intervenção humana.

### 1.7. Padrões de Qualidade, Cache e Testes (QA)

A fundação do projeto adota regras claras de revalidação de dados e testes automatizados para garantir confiabilidade:

**Estratégia de Cache (Next.js Revalidation):**
- As páginas de conteúdo público (como a `/galeria`) serão cacheadas estaticamente na Vercel para máxima performance.
- A atualização desse cache acontecerá **Sob Demanda (On-Demand Revalidation)**. O site não fará buscas no Drive a cada visita. Apenas quando o Admin "Aceitar/Aprovar" uma nova foto no Dashboard, a Server Action disparará a função `revalidatePath('/galeria')`, forçando o Next.js a reconstruir a página com a foto nova imediatamente.

**Lista Obrigatória de Testes Automatizados:**
O projeto deve adotar **Vitest** (Testes Unitários) e **Playwright** (Testes E2E simulando o navegador). A suíte de testes deve cobrir minimamente:
1. **Segurança de Rotas (E2E):** Testar se a rota `/dashboard` bloqueia rigidamente contas "Member" e redireciona não-logados para a Home.
2. **Limites do Gerador (Unit):** Validar as fórmulas e inputs numéricos do formulário, impedindo que os status ultrapassem a faixa de 1 a 10.
3. **Roteamento de Web Components (Integration):** Assegurar que a troca de template (v1 -> v4 -> v6) no Select altera corretamente a classe e a estrutura nativa da carta no DOM.
4. **Geração de PNG (E2E):** Simular o preenchimento de uma carta e o clique no botão "Baixar PNG" para garantir que a promessa do `html2canvas` resolva sem erros.
5. **Integração de Recrutamento (Integration):** Disparar um payload mockado para a rota de recrutamento e checar se a resposta não retorna status 500, garantindo que o form público esteja sempre de pé.

---

## 2. Mapeamento de Domínios (Domain-Driven Design)

O sistema deve ser particionado em domínios lógicos (Bounded Contexts).

### 2.1. Domínio de Cartas e Decks (Core)
- **Responsabilidade:** Gerenciar atributos, balanceamento e criação das cartas e agrupamentos (Pacotes/Decks).
- **Entidades (DB):** `Card` (Carta), `Deck` (Pacote), `CardModel` (Templates: v1-Cristal/Comum, v4-Thumb/FullArt, v6-Showcase/Video).

### 2.2. Domínio de Exportação e Mídia
- **Responsabilidade:** Renderização estática para exportação, geração de PDFs prontos para impressão e processamento de CSV em massa.
- **Entidades:** `ExportJob` (Job de renderização assíncrona).

### 2.3. Domínio de Galeria e Comunidade
- **Responsabilidade:** Exposição pública de fotos da comunidade (membros) integradas e sincronizadas do Google Drive, e recrutamento de novos jogadores.
- **Entidades:** `GalleryPhoto` (Sincronizada do Drive), `Candidate` (Recrutamento).

### 2.4. Domínio de Autenticação e Administração
- **Responsabilidade:** RBAC (Role-Based Access Control), gerenciamento de usuários (Admin, Member, Visitor) e auditoria do sistema.
- **Entidades:** `User`, `Role`, `AuditLog`.

### 2.5. Banco de Dados (Supabase Schema)
Abaixo está a estrutura esperada das tabelas relacionais e buckets de storage no Supabase para suportar os domínios:

**Tabelas Relacionais (PostgreSQL):**

1. `profiles` *(Gerencia perfis e níveis de acesso)*
   - `id` (uuid, Primary Key, Foreign Key para `auth.users`)
   - `email` (text)
   - `role` (text) -> Enum: 'admin', 'member', 'visitor'
   - `display_name` (text) -> Nome de exibição público/interno
   - `bio` (text) -> Descrição do membro
   - `show_on_team` (boolean) -> Se exibe no 'Sobre Nós'
   - `social_links` (jsonb) -> Array de redes sociais
   - `avatar_url` (text) -> Caminho para a imagem no bucket `avatars`

2. `packages` *(Álbuns/Coleções de Cartas)*
   - `id` (uuid, Primary Key)
   - `nome` (text) -> Nome do pacote (ex: Vídeo Específico)
   - `cor` (text) -> Cor hexadecimal padrão para o pacote
   - `created_at` (timestamp)

3. `cards` *(A entidade central, o acervo principal)*
   - `id` (uuid, Primary Key)
   - `package_id` (uuid, Foreign Key para `packages`)
   - `titulo` (text) -> Nome do personagem/carta
   - `cor` (text) -> Cor personalizada ou herdada do pacote
   - `tipo` (text) -> Categoria do trunfo (ex: Baleler, Momento)
   - `atributos` (jsonb) -> Notas da carta: `{ entretenimento, vergonha_alheia, competencia, balela, climao }`
   - `frase` (text) -> Frase marcante
   - `modelo` (text) -> Enum ativo: 'v1-default', 'v4-thumb', 'v6-showcase'
   - `foto` (text) -> URL/Caminho da foto
   - `zoom`, `pos_x`, `pos_y` (float) -> Dados do Image Editor (crop/pan) para a foto
   - `video_origem` (text) -> Referência legado (opcional)

4. `audit_logs` *(Rastreabilidade de Ações)*
   - `id` (uuid, Primary Key)
   - `user_id` (uuid, Foreign Key para `profiles`)
   - `action` (text) -> Ação realizada (ex: 'UPDATE_PROFILE', 'DELETE_USER')
   - `description` (jsonb) -> Metadados/Payload da ação
   - `created_at` (timestamp)

5. `site_metrics` *(Analytics interno e engajamento)*
   - `id` (uuid, Primary Key)
   - `origin` (text) -> Origem do tráfego (ex: link tree, youtube)
   - `page_visited` (text) -> Qual página visualizou
   - `session_id` (text) -> Identificador anônimo
   - `user_id` (uuid, null) -> Se logado, quem visitou
   - `created_at` (timestamp)

**Buckets (Supabase Storage):**
- `card-photos`: Bucket para armazenamento das fotos enviadas para compor as cartas.
- `avatars`: Bucket exclusivo para as fotos de perfil dos usuários na área administrativa.

### 2.6. Sistema de Permissões (Roles)
O acesso às áreas restritas do Dashboard e os limites da API são controlados pelo cargo (role) atrelado ao `profile` do usuário:

- **`admin` (Administrador):** Acesso irrestrito e total à plataforma. Único cargo com permissão de acesso ao Dashboard.
  - *Pode:* Acessar todas as rotas de `/dashboard`, gerenciar usuários, visualizar Auditoria de Segurança, moderar fotos do Drive, gerenciar Álbuns e é o **único cargo que pode exportar cartas para impressão (arquivos PDF e processamento em lote)**.
- **`member` (Membro):** Acesso de uso geral para a equipe do Balela.
  - *Pode:* Editar seu próprio perfil na rota `/perfil` e gerenciar seu próprio histórico.
  - *Não Pode:* Acessar o Dashboard, rotas administrativas ou exportar cartas para impressão (PDF).
- **`visitor` (Visitante / Conta Limitada):** Privilégio mínimo para a área logada.
  - *Pode:* Fazer login, ver seu perfil e atuar como conta de transição.

> **Nota sobre o Gerador:** O uso da ferramenta `/gerador` e a funcionalidade de **baixar as cartas individualmente em PNG** são abertos ao público em geral (mesmo para usuários não logados). Apenas a exportação profissional para impressão (PDFs) é restrita aos Admins.

### 2.7. Dashboard Admin: Métricas e KPIs

A página `/dashboard` será o centro de comando visual para os Administradores. Ela deverá cruzar dados do banco (tabelas `cards`, `profiles`, `audit_logs` e `site_metrics`) para exibir o panorama do projeto:

**Indicadores Principais (Cards de Resumo / Top-Level):**
- **Acervo de Cartas:** Total absoluto de cartas criadas.
- **Membros Registrados:** Contagem de perfis ativos na plataforma.
- **Fotos Pendentes na Galeria:** Contador de imagens submetidas pelo público aguardando a moderação/aprovação do Admin.
- **Tráfego no Gerador (Mensal):** Volume de visitas públicas na rota `/gerador`.

**Métricas de Infraestrutura e Custos (Saúde do Sistema):**
- **Armazenamento Database (Supabase DB):** Consumo em MB/GB do banco relacional (PostgreSQL). Mantém o controle se a conta está dentro do limite do plano.
- **Armazenamento de Arquivos (Supabase Storage/Blob):** Consumo em GB dos buckets (`card-photos` e `avatars`). Vital para monitorar o peso das imagens enviadas pelos usuários.
- **Cota de E-mails (Resend):** Volume de e-mails transacionais (convites/recrutamento) disparados no ciclo mensal, prevenindo esgotamento da franquia.
- **Uso do Google Drive (API e Storage):** Indicador do volume de dados consumido pela pasta da Galeria no Google Workspace e alertas sobre o uso diário da API (prevenindo *Rate Limits* durante as atualizações de cache).

**Gráficos Analíticos (Visualização de Dados):**
- **Distribuição de Modelos (Gráfico de Rosca/Pizza):** Porcentagem de uso entre os templates (Ex: *60% v1-Cristal, 30% v4-Thumb, 10% v6-Showcase*).
- **Cartas por Pacote/Álbum (Gráfico de Barras):** Permite visualizar quais coleções (ex: "Produção", "Balelers") estão mais povoadas.
- **Engajamento Diário (Gráfico de Linha):** Curva de acessos cruzando os dados da `site_metrics` para ver picos de acesso público após lançamentos ou vídeos.

**Painéis de Monitoramento em Tempo Real:**
- **Feed de Auditoria de Segurança:** Lista contínua mostrando as últimas ações destrutivas ou críticas (Ex: *"Admin X deletou a carta Y"*, *"Admin Z alterou o cargo de Y para Admin"*).
- **Últimas Cartas Adicionadas:** Grid rápida exibindo os últimos 5 personagens inseridos no banco.

---

## 3. Arquitetura do Backend (Node.js + Clean Architecture)

A estrutura de pastas refletirá as camadas da Clean Architecture.

```text
/backend
├── /src
│   ├── /domain               # Entidades e Regras de Negócio Puras (ex: Validar limite de pontos da carta)
│   ├── /application          # Casos de Uso (ex: CreateCardUseCase, GeneratePdfUseCase)
│   ├── /infrastructure       # Implementações externas (ex: SupabaseRepository, DriveServiceImpl)
│   ├── /presentation         # Interface de Entrada (ex: Controllers Express, WebSockets)
│   └── /main                 # Factories, Injeção de Dependências e Configuração (ex: server.ts)
```

### Mapeamento de Rotas e Casos de Uso (Funções)

Abaixo estão todas as rotas planejadas para a nova API RESTful e suas respectivas funções (Use Cases) no sistema:

#### 1. Autenticação e Administração (`/api/v1/auth` e `/api/v1/admin`)
- `POST /api/v1/auth/login` -> **Função:** `Autenticar Usuário` (Login)
- `POST /api/v1/auth/logout` -> **Função:** `Encerrar Sessão` (Logout)
- `GET /api/v1/admin/users` -> **Função:** `Listar Usuários do Sistema`
- `POST /api/v1/admin/users` -> **Função:** `Criar Novo Usuário` (Criação direta no banco)
- `POST /api/v1/admin/users/invite` -> **Função:** `Convidar Usuário` (Envio de e-mail com link de acesso)
- `PUT /api/v1/admin/users/:id` -> **Função:** `Modificar Permissões/Dados do Usuário`
- `DELETE /api/v1/admin/users/:id` -> **Função:** `Remover Usuário`

#### 2. Álbuns e Pacotes (`/api/v1/decks`)
- `GET /api/v1/decks` -> **Função:** `Listar Todos os Álbuns`
- `GET /api/v1/decks/:id` -> **Função:** `Obter Detalhes do Álbum`
- `POST /api/v1/decks` -> **Função:** `Criar Álbum`
- `PUT /api/v1/decks/:id` -> **Função:** `Modificar Álbum`
- `DELETE /api/v1/decks/:id` -> **Função:** `Deletar Álbum`
- `POST /api/v1/decks/:id/cards` -> **Função:** `Adicionar Cartas a um Álbum`
- `DELETE /api/v1/decks/:id/cards/:cardId` -> **Função:** `Remover Carta do Álbum`

#### 3. Cartas (`/api/v1/cards`)
- `GET /api/v1/cards` -> **Função:** `Listar Todas as Cartas` (com paginação/filtros)
- `GET /api/v1/cards/:id` -> **Função:** `Obter Detalhes da Carta`
- `POST /api/v1/cards` -> **Função:** `Criar Nova Carta`
- `PUT /api/v1/cards/:id` -> **Função:** `Modificar Carta`
- `DELETE /api/v1/cards/:id` -> **Função:** `Deletar Carta`

#### 4. Galeria de Fotos e Mídia (`/api/v1/media` e `/api/v1/gallery`)
- `GET /api/v1/gallery` -> **Função:** `Listar Fotos da Comunidade` (Sincronizadas do Drive)
- `POST /api/v1/media/upload` -> **Função:** `Fazer Upload Interno de Imagem` (Para painel Admin)
- `POST /api/v1/media/submit-photo` -> **Função:** `Receber e Enviar Foto do Formulário Público para o Google Drive`
- `GET /api/v1/media/drive-search` -> **Função:** `Buscar Imagens no Google Drive`

#### 5. Exportação, Importação e PDF (`/api/v1/export` e `/api/v1/import`)
- `POST /api/v1/export/pdf` -> **Função:** `Gerar Arquivo PDF` (Processamento em Background)
- `GET /api/v1/export/jobs/:id` -> **Função:** `Checar Status de Geração do PDF`

#### 6. Recrutamento e Comunidade (`/api/v1/recruitment`)
- `POST /api/v1/recruitment/apply` -> **Função:** `Enviar Formulário de Candidatura`
- `GET /api/v1/admin/recruitment` -> **Função:** `Listar Candidatos` (Para os Administradores)

---

## 4. Arquitetura do Frontend (React + Web Components)

### Estrutura de Pastas
```text
/frontend
├── /src
│   ├── /components           # Componentes UI React Genéricos (Botões, Modais)
│   ├── /features             # Componentes agrupados por domínio (Cards, Admin, Gallery)
│   ├── /hooks                # Custom Hooks React
│   ├── /services             # Integração com as rotas do Backend via Axios
│   ├── /store                # Gerenciamento de Estado (Zustand ou Redux Toolkit)
│   ├── /web-components       # Cartas isoladas em Vanilla JS (Custom Elements)
│   └── /pages                # Views principais (Dashboard, Editor, Galeria)
```

### Isolamento dos Modelos de Cartas (Web Components)
Para resolver o problema de renderização fragmentada, criaremos Custom Elements literais:
- Criamos o componente: `class BalelaCardV1 extends HTMLElement { ... }`
- Registramos: `customElements.define('balela-card-v1', BalelaCardV1)`
- **Uso no React:** `<balela-card-v1 data='{"name": "Fulano", "power": 90}' />`
- **Por que?** Isso permite que o próprio backend (usando Puppeteer) renderize o mesmo componente injetando um script leve, garantindo 100% de paridade visual entre a tela de preview do React e o PDF gerado.

### Mapeamento de Páginas (Views)

Abaixo está o roteamento das páginas (telas) no frontend da aplicação, dividido entre área pública e área administrativa.

#### Telas Normais (Públicas e Autenticadas)
- `/` -> **Home:** Página inicial.
  - **Funções:** Visualizar destaques do projeto, navegar para outras áreas (Call to Actions principais), visualizar banner dinâmico.
- `/sobre` -> **Sobre Nós:** História e equipe.
  - **Funções:** Leitura institucional, conhecer a hierarquia da equipe, visualizar links sociais.
- `/galeria` -> **Galeria de Fotos:** Exibição de fotos dos membros.
  - **Funções:** Listar fotos sincronizadas diretamente das pastas do Google Drive, organizar por eventos ou anos, permitir que os usuários vejam o histórico visual da comunidade.
- `/gerador` -> **Gerador de Cartas:** Onde a mágica acontece. Acessível ao público.
  - **Funções:** Selecionar qual modelo usar (restrito aos ativos: v1-Cristal, v4-Thumb, v6-Showcase), preencher status da carta (nome, poderes), visualizar preview em tempo real e **baixar a carta em formato PNG (liberado para todos)**. O botão de "Exportar para Impressão" (PDF) ficará oculto/bloqueado para não-Admins.
- `/perfil` -> **Perfil do Usuário:** Área privada para membros logados (independente de ser Admin).
  - **Funções:** Atualizar foto de perfil, editar informações pessoais (email, nome), trocar senha, ver seu histórico de ações ou cartas vinculadas à sua conta.
- `/*` -> **Erro 404:** Rota não encontrada.
  - **Funções:** Exibir mensagem amigável de erro e botão rápido de retorno para a Home.

#### Telas Dash (Acesso Restrito Exclusivo para Administradores)
- `/dashboard` -> **Painel Geral:** Visão panorâmica do sistema.
  - **Funções:** Visualizar gráficos e métricas (quantidade de cartas geradas, acessos, etc), ver alertas importantes de sistema, atalhos rápidos para gestão.
- `/dashboard/galeria` -> **Gerenciador de Fotos (Drive):** Administração da Galeria de Fotos.
  - **Funções:** Configurar quais pastas do Google Drive serão sincronizadas com a página pública, moderar fotos (aprovar/ocultar imagens específicas), forçar sincronização manual.
- `/dashboard/usuarios` -> **Gestão de Pessoas:** Controle de permissões.
  - **Funções:** Listar todos os usuários da plataforma, promover/rebaixar cargos (Role-Based Access: Admin, Editor, etc), banir usuários, gerar links de convite para novos membros.
- `/dashboard/auditoria` -> **Logs e Segurança:** Rastreamento de ações.
  - **Funções:** Visualizar histórico detalhado de quem fez o que no sistema (ex: "Admin X deletou a carta Y"), investigar erros ou ações sensíveis.

#### Formulários (Forms Isolados e Landing Pages)
- `/recrutamento` -> **Central de Inscrições e Envio:** Formulário público focado em conversão.
  - **Funções:** Captar dados do candidato (nome, motivação), permitir anexo/envio de fotos (upload direto para a pasta correta no Google Drive), gerar notificação interna para que os Admins avaliem o perfil.

---

## 5. Detalhes do Gerador e Modelos de Cartas

O Gerador é o coração interativo da plataforma. Ele permite criar, customizar e visualizar as cartas do Super Trunfo Balela em tempo real, utilizando a arquitetura de Web Components para garantir paridade exata (1:1) entre a tela e o arquivo exportado.

### 5.1. Funcionalidades do Gerador (Editor de Cartas)
O formulário de criação da carta expõe as seguintes capacidades de edição ao usuário:
- **Dados Principais:** Título da carta, Cor Tema (Color Picker customizado), Frase Marcante e vínculo com um Pacote/Álbum (que pode sobrescrever a cor tema).
- **Tipagem:** Classificação livre do personagem ou situação (Ex: Video, Baleler, Produção, Professor, Convidado, Momento).
- **Atributos do Jogo:** Cinco sliders numéricos (escala de 1 a 10) que definem a força competitiva da carta: *Entretenimento, Vergonha Alheia, Competência, Balela e Climão*.
- **Controle Avançado de Imagem:** 
  - Upload de foto com preview imediato.
  - Sistema de Zoom (Slider para aumentar/diminuir).
  - Pan/Arraste (Drag & Drop) livre na imagem para enquadrar perfeitamente o rosto do personagem na moldura.
  - Botão de Girar (Flip) para visualizar o verso padronizado da carta.
- **Exportação Rápida:** Botão para gerar o PNG final diretamente pelo navegador, liberado para qualquer pessoa que use o gerador.

### 5.2. Modelos Visuais (Templates)
A aplicação possui três templates de Web Components consolidados no `ModelRegistry`, prontos para receberem os dados:

1. **v1 — Cristal (Modelo Padrão):** O clássico e mais utilizado. Conta com uma moldura estilo acrílico/cristal onde a cor tema preenche a barra inferior de status, e a foto fica contida dentro do quadrado superior.
2. **v4 — Thumb (FullArt):** Voltado para cartas raras ou premium. A imagem de fundo preenche a carta inteira (vazando até as bordas), com os textos e ícones flutuando sutilmente com legibilidade adaptativa.
3. **v6 — Showcase (Video):** Um modelo temático diferenciado, com recortes específicos e focado em destacar elementos de quadros de vídeo/live.

---

## 6. Diretrizes de Design e UI/UX (Design System Global)

Para garantir que o novo Super Trunfo Balela seja visualmente impactante e completamente padronizado, o projeto seguirá um rigoroso sistema de design focado em criar um aspecto *premium* e dinâmico.

### 6.1. Estética e Identidade Visual (Solid Flat)
- **Tema Claro e Escuro (Light/Dark Mode):** A arquitetura CSS deve ser construída utilizando variáveis para suportar tanto o tema escuro quanto o claro, permitindo a alternância baseada na preferência do sistema ou botão de controle. A base será de fundos sólidos para garantir alto contraste.
- **Cores Sólidas com Base Roxa:** O design deixará o *glassmorphism* de lado e focará em uma estética "Solid Flat" moderna e limpa. A cor primária e de destaque da plataforma será o **Roxo**, aplicando preenchimentos sólidos nos botões, painéis principais e *call-to-actions*.
- **Tipografia Moderna:** O sistema continuará a adotar fontes geométricas e legíveis do Google Fonts (como *Inter*, *Outfit* ou *Roboto*), mantendo a modernidade e excelente leitura em qualquer escala de dispositivo.

### 6.2. Interatividade e Animações
- **Micro-interações:** A interface deve parecer "viva". Todo botão, link ou carta deve possuir um *feedback* visual imediato ao passar o mouse (*hover*), com transições suaves (`transition: all 0.3s ease`) e pequenos efeitos de escala (`transform: scale()`).
- **Estados Visuais Reais:** Evitaremos *placeholders* básicos. As telas devem ser desenhadas para apresentar as cartas e os dados de forma rica.

### 6.3. Padrões Técnicos e SEO
- **Estilização Nativa:** A fundação do design usará **Vanilla CSS**, garantindo flexibilidade total e herança nativa. Toda a paleta de cores, espaçamentos e fontes serão geridos por variáveis CSS (`:root`) globais, geralmente no `index.css`, permitindo temas dinâmicos sem engessamento.
- **Práticas de SEO:**
  - Aplicação de tags `<title>` dinâmicas e `<meta name="description">` precisas por rota pública.
  - HTML5 semântico (`<main>`, `<article>`, `<nav>`).
  - Único `<h1>` por página estabelecendo a hierarquia correta da informação.

### 6.4. Componentes Globais Obrigatórios (UI Kit)
Para manter a consistência em todo o projeto React, os seguintes componentes deverão ser criados como base no padrão *Solid Flat*:

1. **Navbar Superior (Header):** Fixa no topo, responsiva (menu hambúrguer no mobile). Deve conter a Logo à esquerda, links centrais (`/`, `/sobre`, `/galeria`, `/gerador`), *Toggle* do Modo Claro/Escuro, e o botão/avatar de Login à direita.
2. **Footer (Rodapé):** Bloco inferior minimalista com links úteis, redes sociais e direitos autorais.
3. **Buttons (Sólido e Outline):** O botão mestre baseado na cor roxa. Deve suportar a versão sólida (ação primária), contorno (ação secundária) e versão ícone, sempre com animação de `hover`.
4. **Card Template (Web Component):** O encapsulamento nativo que renderiza os status da carta em tempo real (v1, v4, v6).
5. **Modal / Dialog:** Caixa flutuante centralizada para confirmações críticas (ex: Deletar usuário, Limpar carta) e interações rápidas.
6. **Toast Notifications:** Alertas efêmeros no canto da tela informando sucesso ou erro (ex: "Carta baixada com sucesso!", "Erro no servidor").
7. **Form Inputs (Baseados no Solid Flat):** Campos de texto, áreas de texto (textareas), seletores (dropdowns) e sliders numéricos (para os atributos), todos padronizados com bordas nítidas e cor de foco roxa.

---

## 7. Plano de Execução (Roadmap de Refatoração)

O projeto será reescrito de forma iterativa em um único repositório Full-Stack (Next.js), garantindo a fundação sólida antes das regras de negócios complexas.

### Fase 1: Fundação e Setup (Full-Stack Next.js)
- [ ] Inicialização do projeto Next.js (App Router, TypeScript).
- [ ] Configuração do Supabase (Banco de Dados e Storage) via Cliente SSR.
- [ ] Setup do Design System "Solid Flat" no `index.css` (Variáveis Base Roxa, Tema Dark/Light).
- [ ] Implementação da Autenticação (Supabase Auth) e controle de Middleware para rotas privadas (Admin/Member).
- [ ] Instalação e configuração inicial das ferramentas de Qualidade (Vitest e Playwright).

### Fase 2: Componentes Globais e UI Kit
- [ ] Criação dos componentes de layout: Navbar (com Toggle de Tema), Footer.
- [ ] Criação dos componentes de interação: Buttons, Modal, Toast e Form Inputs.
- [ ] Criação e estilização pura (HTML/CSS) dos Web Components das Cartas (v1-Cristal, v4-Thumb, v6-Showcase).
- [ ] Estruturação da loja global do Zustand.

### Fase 3: Domínio Core (O Gerador e API Routes)
- [ ] Backend Serverless: Criação das Serverless Functions (`/api/cards`, `/api/packages`) aplicando princípios da *Clean Architecture*.
- [ ] Frontend: Criação da página do Gerador interativo, conectando os inputs ao Zustand e refletindo nos Web Components.
- [ ] Motor de Exportação: Integração do `puppeteer-core` (+ Chromium) no backend para gerar imagens/PDFs.
- [ ] Escrever os Testes Unitários (Limites de Status do Gerador) e E2E (Geração de PNG).

### Fase 4: Comunidade, Galeria e Integrações
- [ ] Integração Server-to-Server com a API do Google Drive (Leitura de pastas públicas).
- [ ] Integração com a API do Resend para disparo de convites/e-mails transacionais.
- [ ] Frontend: Desenvolvimento da Galeria de Fotos implementando a revalidação de cache sob demanda (On-Demand Revalidation).
- [ ] Frontend: Formulário de Recrutamento integrado à API Serverless.

### Fase 5: QA Final e Deploy
- [ ] Rodar bateria de Testes E2E (Playwright) validando quebras de segurança (RBAC) e links quebrados.
- [ ] Configuração das Variáveis de Ambiente no painel de Produção.
- [ ] Deploy Final na Vercel e validação de gargalos de memória da Serverless Function.
