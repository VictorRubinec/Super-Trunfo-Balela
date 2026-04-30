const express = require('express');
const { supabase, adminSupabase } = require('../services/supabase-service');

const router = express.Router();

/**
 * Listar equipe pública (Membros que escolheram aparecer no Sobre Nós)
 */
router.get('/team', async (req, res) => {
    try {
        const { data, error } = await adminSupabase
            .from('profiles')
            .select('display_name, bio, avatar_url, social_links, role')
            .eq('show_on_team', true)
            .order('role', { ascending: true }); // Admin primeiro

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
