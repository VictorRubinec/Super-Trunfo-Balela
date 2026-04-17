# Checklist de Execução - Balela Trunfo

## Fase 1: Interface e Usabilidade
- [ ] Ocultar modelos (2, 3, 5) e renomear (Comum, FullArt, Video) no `model-registry.js`
- [ ] Atualizar seletor de modelos no `index.html`
- [ ] Atualizar seletor de tipos Oficiais no `index.html`
- [ ] Implementar Arraste (Drag) da imagem no preview
- [ ] Implementar Slider de Zoom (50% a 200%) no preview
- [ ] Implementar Botão de Reset de imagem (escala/posição)
- [ ] Atualizar lógica de renderização para suportar `pos_x`, `pos_y` e `zoom`

## Fase 2: Gestão de Coleções
- [ ] Criar dicionário de cores fixas por Pacote
- [ ] Sincronizar cor do formulário ao trocar o Pacote
- [ ] Implementar botões de alternância Grade/Lista na galeria
- [ ] Adicionar filtro "Agrupar por Pacote" na galeria

## Fase 3: Supabase (Backend)
- [x] Configurar conexão inicial (`supabase-js`)
- [x] Migrar tabela de cartas local para banco remoto
- [x] Configurar Supabase Storage para fotos
- [x] Implementar Autenticação e Perfis (com permissões)

## Fase 4: Auditoria e Manutenção
- [x] Implementar gatilhos de log para cada ação (CRUD)
- [x] Desenvolver script de Keep-Alive (Ping diário)
- [x] Criar Painel Admin para gestão de usuários e logs
- [x] Implementar fluxo de Onboarding (Definição de senha via convite)
- [x] Criar configuração de deployment para o Vercel (`vercel.json`)
