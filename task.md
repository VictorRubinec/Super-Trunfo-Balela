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
- [ ] Configurar conexão inicial (`supabase-js`)
- [ ] Migrar tabela de cartas local para banco remoto
- [ ] Implementar Autenticação e Perfis (com permissões)
- [ ] Configurar Supabase Storage para fotos

## Fase 4: Auditoria e Manutenção
- [ ] Implementar gatilhos de log para cada ação (CRUD)
- [ ] Desenvolver script de Keep-Alive (Ping diário)
