# Planejamento Final: Balela Trunfo

Este documento consolida as etapas de evolução do projeto, divididas em fases para garantir um desenvolvimento sólido e organizado.

---

## 🚀 Cronograma de Evolução

### Fase 1: Interface e Usabilidade (O Polimento)
*Foco: Melhorar a experiência de criação e visualização local.*
- [ ] **Ajuste de Modelos:** Renomear v1 (Comum), v4 (FullArt) e v6 (Video). Ocultar v2, v3 e v5.
- [ ] **Tipos Oficiais:** Atualizar formulário com os tipos: `Video`, `Baleler`, `Produção`, `Professor`, `Convidado`, `Momento`.
- [ ] **Editor de Imagem:** Implementar arraste (drag) no preview e slider de zoom (50%-200%).
- [ ] **Botão Reset:** Restaurar apenas o enquadramento (escala 100% e centro).

### Fase 2: Organização de Conteúdo (Coleções)
*Foco: Facilitar a gestão de grandes volumes de cartas.*
- [ ] **Gestão de Pacotes:** Criar mapeamento de cores automáticas por Pacote. Sincronizar campo "Cor Tema" ao selecionar pacote.
- [ ] **Visualização em Lista:** Criar modo de exibição em "Linhas" (compacto) além da grade.
- [ ] **Filtros Avançados:** Opção de agrupar a galeria visualmente por Pacotes.

### Fase 3: Nuvem e Persistência (Supabase Core)
*Foco: Transformar o app em uma plataforma multi-usuário.*
- [ ] **Migração de Dados:** Mover o `cards.json` local para a tabela `cards` no Supabase.
- [ ] **Sistema de Usuários:** Implementar autenticação e roles (`admin`, `member`, `visitor`) com políticas RLS.
- [ ] **Storage:** Migrar armazenamento de fotos para o Supabase Storage.

### Fase 4: Segurança e Manutenção (Operação)
*Foco: Garantir a integridade e disponibilidade dos dados.*
- [ ] **Logs de Auditoria:** Tabela `audit_logs` registrando cada ação (Criar, Editar, Deletar).
- [ ] **Sistema Keep-Alive:** Script automatizado (Edge Function ou Cron) para enviar requisições diárias ao Supabase Free, evitando suspensão por inatividade.

---

## 🛠️ Arquitetura Técnica Supabase

### Tabelas Sugeridas
1. **`profiles`**: Dados de perfil e permissões.
2. **`cards`**: Dados principais das cartas.
3. **`packages`**: Catálogo de pacotes e suas cores padrão.
4. **`audit_logs`**: Trilha de auditoria detalhada.

### Permissões (RLS)
| Usuário | Ações |
| :--- | :--- |
| **Admin** | Controle total e visualização de logs. |
| **Membro** | Cria; edita/deleta apenas o que é dele; vê tudo. |
| **Visitante** | Apenas visualização das cartas. |

---

## ✅ Próximos Passos
Toda a execução será acompanhada pelo arquivo `task.md` na raiz do projeto.
