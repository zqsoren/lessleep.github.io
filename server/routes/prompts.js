import express from 'express';

const router = express.Router();

export default function (db, requireAuth) {

    const all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    // Admin Middleware
    const requireAdmin = (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied: Admins only' });
        }
    };

    // ==========================================
    // Public: Get Prompt Tree
    // ==========================================
    router.get('/tree', async (req, res) => {
        try {
            // Fetch all data
            const categories = await all('SELECT * FROM prompt_categories ORDER BY sort_order');
            const subtypes = await all('SELECT * FROM prompt_subtypes ORDER BY sort_order');
            const styles = await all('SELECT * FROM prompt_styles ORDER BY sort_order');

            // Build tree
            const tree = categories.map(cat => ({
                ...cat,
                subtypes: subtypes
                    .filter(sub => sub.category_id === cat.id)
                    .map(sub => ({
                        ...sub,
                        styles: styles
                            .filter(style => style.subtype_id === sub.id)
                            .map(style => {
                                // Parse prompt_content if it's a string JSON
                                let prompt = style.prompt_content;
                                try {
                                    if (typeof prompt === 'string' && prompt.startsWith('{')) {
                                        prompt = JSON.parse(prompt);
                                    }
                                } catch (e) {
                                    // keep as string
                                }

                                return {
                                    ...style,
                                    prompt: prompt
                                };
                            })
                    }))
            }));

            res.json(tree);
        } catch (error) {
            console.error('Get prompt tree error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ==========================================
    // Admin: Update Style
    // ==========================================
    router.put('/style/:id', requireAuth, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { prompt } = req.body; // Expecting prompt object or string

            let promptContent = prompt;
            if (typeof prompt !== 'string') {
                promptContent = JSON.stringify(prompt);
            }

            await run('UPDATE prompt_styles SET prompt_content = ? WHERE id = ?', [promptContent, id]);
            res.json({ message: 'Update successful' });
        } catch (error) {
            console.error('Update prompt error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Add create category/subtype routes here as needed...

    return router;
}
