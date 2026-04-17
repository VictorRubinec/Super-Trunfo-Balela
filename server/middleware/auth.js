const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Cliente global apenas para tarefas administrativas básicas se necessário
const globalSupabase = require('../services/supabase-service');

/**
 * Middleware para validar o token JWT do Supabase e anexar o cliente autenticado
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Não autenticado' });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Token não fornecido' });
        
        // Se as chaves estiverem faltando, o safeCreateClient ou o Banco retornarão erro
        const userClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: { user }, error } = await userClient.auth.getUser();

        if (error || !user) {
            return res.status(401).json({ error: 'Sessão inválida ou expirada' });
        }

        // Buscar Role no banco
        const { data: profile } = await userClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        req.supabase = userClient; // USAR ESTE NAS ROTAS
        req.user = user;
        req.role = profile?.role || 'visitor';
        next();
    } catch (err) {
        console.error('[AuthMiddleware] Erro fatal:', err.message);
        res.status(500).json({ error: 'Erro interno na autenticação: ' + err.message });
    }
}

/**
 * Middleware para exigir role específica (admin ou member)
 */
function authorize(roles = []) {
    return (req, res, next) => {
        if (!roles.includes(req.role)) {
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
}

module.exports = { authenticate, authorize };
