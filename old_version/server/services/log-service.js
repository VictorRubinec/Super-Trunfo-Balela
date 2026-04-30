const { adminSupabase } = require('./supabase-service');

/**
 * Serviço para registrar logs de auditoria detalhados
 */
const LogService = {
    /**
     * @param {Object} params
     * @param {string} params.userId - ID do usuário que fez a ação
     * @param {string} params.action - 'CREATE', 'UPDATE' ou 'DELETE'
     * @param {string} params.tableName - 'cards' ou 'packages'
     * @param {string} params.recordId - ID do registro afetado
     * @param {Object} [params.oldData] - Dados antes da mudança
     * @param {Object} [params.newData] - Dados depois da mudança
     * @param {string} [params.description] - Descrição amigável
     */
    async log(params) {
        try {
            // Usando a adminSupabase (service_role) para ignorar RLS e garantir o registro
            const { error } = await adminSupabase
                .from('audit_logs')
                .insert([{
                    user_id:    params.userId,
                    action:     params.action,
                    table_name: params.tableName,
                    record_id:  params.recordId,
                    old_data:   params.oldData,
                    new_data:   params.newData,
                    description: params.description || this._generateDescription(params)
                }]);

            if (error) console.error('[LogService] Erro ao salvar log:', error.message);
        } catch (err) {
            console.error('[LogService] Erro fatal:', err.message);
        }
    },

    /**
     * Gera uma descrição amigável baseada no diff dos dados
     */
    _generateDescription({ action, oldData, newData, tableName }) {
        if (action === 'CREATE') return `Criou um novo item em ${tableName}`;
        if (action === 'DELETE') return `Removeu um item de ${tableName}`;
        
        if (action === 'UPDATE' && oldData && newData) {
            const changes = [];
            const ignoreKeys = ['updated_at', 'criado_em', 'user_id', 'id'];
            
            for (const key in newData) {
                if (ignoreKeys.includes(key)) continue;
                
                const oldVal = JSON.stringify(oldData[key]);
                const newVal = JSON.stringify(newData[key]);
                
                if (oldVal !== newVal) {
                    changes.push(`${key}: ${oldVal} → ${newVal}`);
                }
            }
            return changes.length > 0 ? `Alterou: ${changes.join(' | ')}` : 'Atualizou sem mudanças visíveis';
        }
        
        return `${action} em ${tableName}`;
    }
};

module.exports = LogService;
