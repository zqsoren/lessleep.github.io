// ==========================================
// Recharge Routes
// ==========================================

// Get recharge records
app.get('/api/user/recharge-records', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;

        db.all(
            'SELECT * FROM recharge_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [userId],
            (err, records) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                res.json({ records: records || [] });
            }
        );
    } catch (error) {
        console.error('Get recharge records error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Create recharge order
app.post('/api/user/recharge', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const { package_id, payment_method } = req.body;

        // Package definitions
        const packages = {
            starter: { price: 2.99, credits: 50 },
            popular: { price: 9.9, credits: 200 },
            pro: { price: 29.9, credits: 800 },
        };

        const pkg = packages[package_id];
        if (!pkg) {
            return res.status(400).json({ error: '无效的套餐' });
        }

        // Generate order number
        const orderNumber = 'R' + Date.now() + Math.floor(Math.random() * 1000);

        // Create recharge record
        db.run(
            'INSERT INTO recharge_records (user_id, order_number, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
            [userId, orderNumber, pkg.price, payment_method, 'pending'],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: '创建订单失败' });
                }

                // In production, integrate with payment gateway here
                // For now, we'll simulate immediate success
                db.run(
                    'UPDATE recharge_records SET status = ? WHERE id = ?',
                    ['completed', this.lastID],
                    (err) => {
                        if (err) {
                            console.error('Update order status error:', err);
                        }

                        // Update user credits
                        db.run(
                            'UPDATE users SET remaining_credits = remaining_credits + ? WHERE id = ?',
                            [pkg.credits, userId],
                            (err) => {
                                if (err) {
                                    console.error('Update credits error:', err);
                                }

                                res.json({
                                    message: '充值成功',
                                    order_number: orderNumber,
                                    credits: pkg.credits
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Recharge error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==========================================
// Profile Routes
// ==========================================

// Update user profile
app.put('/api/user/profile', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const { username, phone, bio } = req.body;

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (username) {
            updates.push('username = ?');
            params.push(username);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (bio !== undefined) {
            updates.push('bio = ?');
            params.push(bio);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: '没有要更新的字段' });
        }

        params.push(userId);

        db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params,
            function (err) {
                if (err) {
                    return res.status(500).json({ error: '更新失败' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: '用户不存在' });
                }

                res.json({ message: '更新成功' });
            }
        );
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
