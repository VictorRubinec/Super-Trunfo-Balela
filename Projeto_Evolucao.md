# Planejamento de Evolução: Season Pass Balela

Este documento detalha a transformação do projeto em uma plataforma completa de engajamento para a comunidade do Balela, focada no sistema de fidelidade "Season Pass" e nos colecionáveis do Super Trunfo.

## Visão Geral do Projeto
O **Season Pass Balela** é um sistema de fidelidade criado de fã para fã. Os membros que comparecem às gravações acumulam selos em um cartão fidelidade e ganham prêmios (adesivos, bottons, posters e cartas de Super Trunfo). O objetivo é criar uma comunidade ativa, onde as cartas servem como colecionáveis e ferramentas de jogo rápido entre os membros.

## Filosofia do Projeto
- **Acessibilidade**: Sem barreiras financeiras ou de acesso.
- **Liberdade Criativa**: Estímulo à criação constante.
- **Comunidade**: Feito por membros, para membros.

## Tecnologias e Ferramentas
- **Frontend**: HTML5, CSS3 (Solid Flat Design), Vanilla JavaScript.
- **Backend**: Node.js com Express.
- **Banco de Dados & Auth**: Supabase.
- **Hospedagem**: Vercel.
- **Bibliotecas Principais**:
    - **Lucide Icons**: Ícones SVG profissionais.
    - **html2canvas / dom-to-image**: Exportação de cartas para PNG.
    - **Resend API**: Novo sistema de envios de e-mail.

## Estrutura de Páginas
1.  **Home (`/index`)**: Apresentação do Season Pass, prêmios e inspiração.
2.  **Gerador (`/gerador`)**: Tela de criação de cartas Super Trunfo.
3.  **Galeria (`/galeria`)**: Visualização de todas as cartas criadas.
4.  **Sobre Nós (`/sobre`)**: Créditos, história e perfis da equipe.
5.  **Recrutamento (`/recrutamento`)**: Formulário para novos membros.

## User Review Required

> [!IMPORTANT]
> **Fluxo de Trabalho**: Todo o desenvolvimento será realizado na branch `feature/evolucao-projeto`. Nada será enviado para a `main` até a validação final.

> [!NOTE]
> **Refinamento do Texto de Inspiração**: 
> "Sempre admirei a resiliência do Calango, do Zero e do Caio em tirar ideias do papel e dar vida ao novo. Ver os bastidores das produções foi o combustível que eu precisava para começar: desde o lendário vídeo 'Plano' do Calango e as músicas do Zero, até a forma incrível como o Caio transformou o Balela em algo extraordinário. Obrigado aos piores alunos que qualquer professor poderia ter, pela inspiração constante para criar o meu próprio caminho."

## Etapas de Construção

### 1. Preparação e Design (Solid Flat Design)
- **Branch**: Criação da `feature/evolucao-projeto`.
- **Paleta de Cores**: Tons sólidos e profundos (Obsidiana, Roxo Balela, ardósia), eliminando gradientes e efeitos "IA".
- **Ícones**: Substituição de todos os emojis pela biblioteca **Lucide Icons** (SVG).
- **Tipografia**: Manter a base na fonte 'Outfit', mas com pesos e espaçamentos mais agressivos e modernos.

### 2. Reestruturação de Arquivos
- **Migração**: O gerador atual (`index.html`) será movido para `public/gerador.html`.
- **Componentização**: Criação de um `header` e `footer` compartilhados para todas as páginas.

### 3. Desenvolvimento das Novas Telas
- **Home (`public/index.html`)**: 
    - Seção Hero apresentando o Season Pass.
    - Timeline dos 10 prêmios (destacando que estamos no 2º).
    - Seção "Inspiração" com os perfis de Thiago Elias (Calango), Zero Badass e Caio Romano.
- **Sobre Nós (`public/sobre.html`)**:
    - Seção da Equipe: Perfil do Victor (Cargo, Bio, Links).
    - Estrutura pronta para novos recrutas (Cargo, Bio, Redes, Portfólio).
- **Galeria e Gerador**: Atualização visual para o novo sistema de design.

### 4. Funcionalidades Técnicas
- **Sistema de Exportação**: Integração da biblioteca para salvar cartas como **PNG com transparência**.
- **Sistema de Email**: Migração para o **Resend API** para garantir entrega e contornar limites.

### 5. Polimento e Lançamento
- Revisão de todos os textos e responsividade.
- Merge da branch de funcionalidade na branch principal após aprovação.

## Perguntas em Aberto
- [x] **Redes Sociais**: Victor optou por deixar para o final do projeto.
- [x] **Imagens**: Usaremos placeholders ilustrativos até que as fotos reais dos prêmios estejam disponíveis.
