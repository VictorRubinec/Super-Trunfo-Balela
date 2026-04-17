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
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autenticado' });

    const token = authHeader.split(' ')[1];
    
    // Criamos um cliente exclusivo para esta requisição usando o TOKEN do usuário
    // Isso permite que o Banco de Dados (RLS) reconheça quem está agindo
    const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await userClient.auth.getUser();

    if (error || !user) {
        return res.status(401).json({ error: 'Sessão inválida' });
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
