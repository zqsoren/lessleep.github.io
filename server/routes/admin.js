import express from 'express';

const router = express.Router();

export default function (db, requireAuth) {

    const all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    const get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    // Admin Middleware (Simple check)
    const requireAdmin = (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied: Admins only' });
        }
    };

    // ==========================================
    // Dashboard Stats
    // ==========================================
    router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
        try {
            // Total users
            const userCount = await get('SELECT COUNT(*) as count FROM users');
            // Active users (last login < 24h)
            const activeCount = await get("SELECT COUNT(*) as count FROM users WHERE last_login > datetime('now', '-1 day')");
            // Total generations
            const genCount = await get('SELECT SUM(total_generations) as count FROM users');
            // Total login duration (hours)
            const durationSum = await get('SELECT SUM(total_login_duration) as seconds FROM users');

            res.json({
                totalUsers: userCount.count,
                activeUsers: activeCount.count,
                totalGenerations: genCount.count || 0,
                totalHours: Math.round((durationSum.seconds || 0) / 3600)
            });
        } catch (error) {
            console.error('Admin stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ==========================================
    // User Management
    // ==========================================
    router.get('/users', requireAuth, requireAdmin, async (req, res) => {
        try {
            // Get all user details extended stats
            // Including project count (need to join or subquery)

            const sql = `
                SELECT 
                    u.id, u.username, u.email, u.phone, u.role, u.status, u.avatar,
                    u.created_at, u.last_login, u.total_login_duration,
                    u.total_generations, u.monthly_generations, u.remaining_credits, 
                    u.membership_level, u.gift_generations, u.monthly_remaining_generations,
                    (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) as project_count
                FROM users u
                ORDER BY u.created_at DESC
            `;

            const users = await all(sql);
            res.json({ users });
        } catch (error) {
            console.error('Admin users error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Delete/Ban user
    router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
        // Implementation for delete or ban
        res.json({ message: 'Not implemented yet' });
    });

    // Toggle User Status
    router.put('/users/:id/status', requireAuth, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            await run('UPDATE users SET status = ? WHERE id = ?', [status, id]);
            res.json({ message: 'Status updated' });
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Get User Recharge Records
    router.get('/users/:id/recharge', requireAuth, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const records = await all('SELECT * FROM recharge_records WHERE user_id = ? ORDER BY created_at DESC', [id]);
            res.json({ records: records || [] });
        } catch (error) {
            console.error('Get user recharges error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ==========================================
    // Prompt Management (Admin)
    // ==========================================

    // Get all prompts (Flat list for admin)
    router.get('/prompts', requireAuth, requireAdmin, async (req, res) => {
        try {
            // Join tables to get readable names
            const sql = `
                SELECT s.id, s.name as style_name, s.prompt_content as prompt, s.updated_at,
                       st.name as subtype_name, st.id as subtype_id,
                       c.name as category_name, c.id as category_id
                FROM prompt_styles s
                JOIN prompt_subtypes st ON s.subtype_id = st.id
                JOIN prompt_categories c ON st.category_id = c.id
                ORDER BY c.sort_order, st.sort_order, s.sort_order
            `;
            const prompts = await all(sql);

            // Format for frontend
            const formatted = prompts.map(p => ({
                id: p.id,
                category_id: p.category_name, // Frontend expects names or IDs? Interface says string. Let's use name or ID based on UI.
                // UI shows: {prompt.category_id} / {prompt.subtype_id}
                // Let's pass the Name if possible, or ID.
                // The SQL selects category_name. Let's send that.
                // Wait, the interface says category_id. 
                // Let's check frontend: `<div>{selectedPrompt.category_id} / {selectedPrompt.subtype_id}</div>`
                // If I send names, it will show names.
                category_name: p.category_name,
                subtype_id: p.subtype_name,
                style_id: p.id,
                style_name: p.style_name,
                prompt: p.prompt,
                updated_at: p.updated_at
            }));

            // Frontend expects { prompts: [...] }
            res.json({ prompts: formatted });
        } catch (error) {
            console.error('Get admin prompts error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Update Prompt
    router.put('/prompts/:id', requireAuth, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { prompt } = req.body;
            await run('UPDATE prompt_styles SET prompt_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [prompt, id]);
            res.json({ message: 'Prompt updated' });
        } catch (error) {
            console.error('Update prompt error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
}
