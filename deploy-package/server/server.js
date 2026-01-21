import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Static files - serve uploaded images
const uploadsPath = join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log(`📁 Serving static files from: ${uploadsPath}`);

// Database setup
const dbPath = join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    // Users table with extended fields
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            phone TEXT,
            avatar TEXT,
            status TEXT DEFAULT 'active',
            last_login DATETIME,
            total_generations INTEGER DEFAULT 0,
            monthly_generations INTEGER DEFAULT 0,
            remaining_credits INTEGER DEFAULT 100,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table ready');
            // Add new columns to existing table if they don't exist
            addColumnIfNotExists('users', 'role', 'TEXT DEFAULT "user"');
            addColumnIfNotExists('users', 'phone', 'TEXT');
            addColumnIfNotExists('users', 'status', 'TEXT DEFAULT "active"');
            addColumnIfNotExists('users', 'last_login', 'DATETIME');
            addColumnIfNotExists('users', 'total_generations', 'INTEGER DEFAULT 0');
            addColumnIfNotExists('users', 'monthly_generations', 'INTEGER DEFAULT 0');
            addColumnIfNotExists('users', 'remaining_credits', 'INTEGER DEFAULT 100');
            addColumnIfNotExists('users', 'total_login_duration', 'INTEGER DEFAULT 0');
            addColumnIfNotExists('users', 'membership_level', 'TEXT DEFAULT "free"');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating verification_codes table:', err);
        } else {
            console.log('Verification codes table ready');
        }
    });

    // Recharge records table
    db.run(`
        CREATE TABLE IF NOT EXISTS recharge_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            order_number TEXT UNIQUE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating recharge_records table:', err);
        } else {
            console.log('Recharge records table ready');
        }
    });

    // Prompt templates table
    db.run(`
        CREATE TABLE IF NOT EXISTS prompt_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id TEXT NOT NULL,
            subtype_id TEXT NOT NULL,
            style_id TEXT NOT NULL,
            style_name TEXT NOT NULL,
            prompt TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by INTEGER,
            FOREIGN KEY (updated_by) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating prompt_templates table:', err);
        } else {
            console.log('Prompt templates table ready');
        }
    });

    // Generation records table
    db.run(`
        CREATE TABLE IF NOT EXISTS generation_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category_id TEXT,
            subtype_id TEXT,
            style_id TEXT,
            prompt TEXT,
            image_url TEXT,
            status TEXT DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating generation_records table:', err);
        } else {
            console.log('Generation records table ready');
        }
    });

    // Projects table
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            image TEXT,
            date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating projects table:', err);
        } else {
            console.log('Projects table ready');
        }
    });

    // Project files table
    db.run(`
        CREATE TABLE IF NOT EXISTS project_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            file_type TEXT NOT NULL,
            file_url TEXT NOT NULL,
            file_name TEXT,
            generation_record_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (generation_record_id) REFERENCES generation_records(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating project_files table:', err);
        } else {
            console.log('Project files table ready');
        }
    });

    // User membership table
    db.run(`
        CREATE TABLE IF NOT EXISTS user_membership (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            membership_level TEXT DEFAULT 'free',
            total_recharge_amount DECIMAL(10,2) DEFAULT 0,
            monthly_quota INTEGER DEFAULT 100,
            monthly_used INTEGER DEFAULT 0,
            bonus_quota INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating user_membership table:', err);
        } else {
            console.log('User membership table ready');
        }
    });

    // Login sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS login_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            logout_time DATETIME,
            duration_minutes INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating login_sessions table:', err);
        } else {
            console.log('Login sessions table ready');
        }
    });
}

// Helper function to add column if not exists
function addColumnIfNotExists(table, column, type) {
    db.all(`PRAGMA table_info(${table})`, (err, columns) => {
        if (err) {
            console.error(`Error checking ${table} columns:`, err);
            return;
        }

        const columnExists = columns.some(col => col.name === column);
        if (!columnExists) {
            db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
                if (err) {
                    console.error(`Error adding ${column} to ${table}:`, err);
                } else {
                    console.log(`Added ${column} to ${table}`);
                }
            });
        }
    });
}

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, verificationCode } = req.body;

        // Validate input
        if (!username || !email || !password || !verificationCode) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }

        // Verify code
        db.get(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
            [email, verificationCode],
            async (err, codeRow) => {
                if (err) {
                    return res.status(500).json({ error: '服务器错误' });
                }

                if (!codeRow) {
                    return res.status(400).json({ error: '验证码无效或已过期' });
                }

                // Check if user exists
                db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
                    if (err) {
                        return res.status(500).json({ error: '服务器错误' });
                    }

                    if (row) {
                        return res.status(400).json({ error: '用户名或邮箱已存在' });
                    }

                    // Hash password
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Create user
                    db.run(
                        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                        [username, email, hashedPassword],
                        function (err) {
                            if (err) {
                                return res.status(500).json({ error: '注册失败' });
                            }

                            // Generate token
                            const token = jwt.sign(
                                { userId: this.lastID, username, email },
                                JWT_SECRET,
                                { expiresIn: '7d' }
                            );

                            const newUserId = this.lastID;

                            // Create membership record for new user
                            db.run(
                                'INSERT INTO user_membership (user_id) VALUES (?)',
                                [newUserId],
                                (err) => {
                                    if (err) {
                                        console.error('Error creating membership:', err);
                                    }

                                    res.json({
                                        message: '注册成功',
                                        token,
                                        user: { id: newUserId, username, email, membershipLevel: 'free' }
                                    });
                                }
                            );
                        }
                    );
                });
            }
        );
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码都是必填的' });
        }

        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: '服务器错误' });
            }

            if (!user) {
                return res.status(401).json({ error: '用户名或密码错误' });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({ error: '用户名或密码错误' });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, username: user.username, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Create login session
            db.run(
                'INSERT INTO login_sessions (user_id) VALUES (?)',
                [user.id],
                function (err) {
                    if (err) {
                        console.error('Error creating login session:', err);
                    }

                    const sessionId = this.lastID;

                    // Update last login time
                    db.run(
                        'UPDATE users SET last_login = datetime("now") WHERE id = ?',
                        [user.id],
                        (err) => {
                            if (err) {
                                console.error('Error updating last login:', err);
                            }

                            res.json({
                                message: '登录成功',
                                token,
                                sessionId,
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    email: user.email,
                                    role: user.role || 'user',
                                    avatar: user.avatar,
                                    membershipLevel: user.membership_level || 'free'
                                }
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Send verification code
app.post('/api/auth/send-code', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: '邮箱是必填的' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save code to database
        db.run(
            'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
            [email, code, expiresAt.toISOString()],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: '发送验证码失败' });
                }

                // In production, send email here
                console.log(`Verification code for ${email}: ${code}`);

                res.json({
                    message: '验证码已发送',
                    code // Remove this in production!
                });
            }
        );
    } catch (error) {
        console.error('Send code error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Verify token
app.get('/api/auth/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '未提供token' });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Token无效' });
            }

            db.get('SELECT id, username, email, role, avatar FROM users WHERE id = ?', [decoded.userId], (err, user) => {
                if (err || !user) {
                    return res.status(401).json({ error: '用户不存在' });
                }

                res.json({ user });
            });
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==========================================
// Authentication Middleware
// ==========================================

function requireAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '未登录' });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Token无效' });
            }

            db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.userId], (err, user) => {
                if (err || !user) {
                    return res.status(401).json({ error: '用户不存在' });
                }

                req.user = user;
                req.userId = user.id;
                next();
            });
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
}

// ==========================================
// Admin Middleware
// ==========================================

function requireAdmin(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '未提供token' });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Token无效' });
            }

            db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.userId], (err, user) => {
                if (err || !user) {
                    return res.status(401).json({ error: '用户不存在' });
                }

                if (user.role !== 'admin') {
                    return res.status(403).json({ error: '需要管理员权限' });
                }

                req.user = user;
                next();
            });
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
}

// ==========================================
// User API Routes
// ==========================================

// Get user statistics
app.get('/api/user/stats', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;

        db.get(
            `SELECT 
                monthly_generations as monthlyGenerations,
                total_generations as totalGenerations,
                remaining_credits as remainingQuota,
                100 as monthlyQuota,
                0 as monthlyDuration,
                0 as totalDuration,
                'free' as membershipLevel,
                0 as totalRecharge
            FROM users WHERE id = ?`,
            [userId],
            (err, stats) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                res.json(stats || {
                    monthlyGenerations: 0,
                    totalGenerations: 0,
                    remainingQuota: 100,
                    monthlyQuota: 100,
                    monthlyDuration: 0,
                    totalDuration: 0,
                    membershipLevel: 'free',
                    totalRecharge: 0
                });
            }
        );
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==========================================
// Admin Routes
// ==========================================

// Get all users (with search and filters)
app.get('/api/admin/users', requireAdmin, (req, res) => {
    try {
        const { search, status, startDate, endDate, page = 1, limit = 20 } = req.query;

        let query = 'SELECT id, username, email, phone, role, status, remaining_credits, total_generations, monthly_generations, created_at, last_login FROM users WHERE 1=1';
        const params = [];

        // Search filter
        if (search) {
            query += ' AND (username LIKE ? OR email LIKE ? OR phone LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Status filter
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        // Date range filter
        if (startDate) {
            query += ' AND created_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND created_at <= ?';
            params.push(endDate);
        }

        // Count total
        db.get(`SELECT COUNT(*) as total FROM (${query})`, params, (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: '查询失败' });
            }

            // Pagination
            const offset = (page - 1) * limit;
            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);

            db.all(query, params, (err, users) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                res.json({
                    users,
                    total: countResult.total,
                    page: parseInt(page),
                    totalPages: Math.ceil(countResult.total / limit)
                });
            });
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Update user status
app.put('/api/admin/users/:id/status', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'disabled'].includes(status)) {
            return res.status(400).json({ error: '无效的状态值' });
        }

        db.run('UPDATE users SET status = ? WHERE id = ?', [status, id], function (err) {
            if (err) {
                return res.status(500).json({ error: '更新失败' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '用户不存在' });
            }

            res.json({ message: '状态更新成功' });
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Get user recharge records
app.get('/api/admin/users/:id/recharge', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;

        db.all(
            'SELECT * FROM recharge_records WHERE user_id = ? ORDER BY created_at DESC',
            [id],
            (err, records) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                res.json({ records });
            }
        );
    } catch (error) {
        console.error('Get recharge records error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Get all prompt templates
app.get('/api/admin/prompts', requireAdmin, (req, res) => {
    try {
        db.all('SELECT * FROM prompt_templates ORDER BY category_id, subtype_id, style_id', (err, prompts) => {
            if (err) {
                return res.status(500).json({ error: '查询失败' });
            }

            res.json({ prompts });
        });
    } catch (error) {
        console.error('Get prompts error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Update prompt template
app.put('/api/admin/prompts/:id', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: '提示词不能为空' });
        }

        db.run(
            'UPDATE prompt_templates SET prompt = ?, updated_at = datetime("now"), updated_by = ? WHERE id = ?',
            [prompt, req.user.id, id],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: '更新失败' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: '提示词不存在' });
                }

                res.json({ message: '提示词更新成功' });
            }
        );
    } catch (error) {
        console.error('Update prompt error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Create new prompt template
app.post('/api/admin/prompts', requireAdmin, (req, res) => {
    try {
        const { category_id, subtype_id, style_id, style_name, prompt } = req.body;

        if (!category_id || !subtype_id || !style_id || !style_name || !prompt) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }

        db.run(
            'INSERT INTO prompt_templates (category_id, subtype_id, style_id, style_name, prompt, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
            [category_id, subtype_id, style_id, style_name, prompt, req.user.id],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: '创建失败' });
                }

                res.json({
                    message: '提示词创建成功',
                    id: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Create prompt error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Get generation records
app.get('/api/admin/generations', requireAdmin, (req, res) => {
    try {
        const { userId, startDate, endDate, page = 1, limit = 20 } = req.query;

        let query = 'SELECT g.*, u.username FROM generation_records g LEFT JOIN users u ON g.user_id = u.id WHERE 1=1';
        const params = [];

        if (userId) {
            query += ' AND g.user_id = ?';
            params.push(userId);
        }

        if (startDate) {
            query += ' AND g.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND g.created_at <= ?';
            params.push(endDate);
        }

        // Count total
        db.get(`SELECT COUNT(*) as total FROM (${query})`, params, (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: '查询失败' });
            }

            // Pagination
            const offset = (page - 1) * limit;
            query += ` ORDER BY g.created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);

            db.all(query, params, (err, records) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                res.json({
                    records,
                    total: countResult.total,
                    page: parseInt(page),
                    totalPages: Math.ceil(countResult.total / limit)
                });
            });
        });
    } catch (error) {
        console.error('Get generations error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==========================================
// Projects API
// ==========================================

// Get user's projects
app.get('/api/projects', requireAuth, (req, res) => {
    try {
        const { limit, offset = 0 } = req.query;
        let query = 'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC';
        const params = [req.userId];

        if (limit) {
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
        }

        db.all(query, params, (err, projects) => {
            if (err) {
                return res.status(500).json({ error: '查询失败' });
            }

            res.json({ projects });
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Create new project
app.post('/api/projects', requireAuth, (req, res) => {
    try {
        const { name, description, image } = req.body;

        if (!name) {
            return res.status(400).json({ error: '项目名称不能为空' });
        }

        const date = new Date().toISOString().split('T')[0];

        db.run(
            'INSERT INTO projects (user_id, name, description, image, date) VALUES (?, ?, ?, ?, ?)',
            [req.userId, name, description, image, date],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: '创建项目失败' });
                }

                res.json({
                    message: '项目创建成功',
                    project: {
                        id: this.lastID,
                        user_id: req.userId,
                        name,
                        description,
                        image,
                        date
                    }
                });
            }
        );
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Get project details
app.get('/api/projects/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;

        db.get(
            'SELECT * FROM projects WHERE id = ? AND user_id = ?',
            [id, req.userId],
            (err, project) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                if (!project) {
                    return res.status(404).json({ error: '项目不存在或无权访问' });
                }

                res.json({ project });
            }
        );
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Update project
app.put('/api/projects/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image } = req.body;

        db.run(
            'UPDATE projects SET name = ?, description = ?, image = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?',
            [name, description, image, id, req.userId],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: '更新失败' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: '项目不存在或无权访问' });
                }

                res.json({ message: '项目更新成功' });
            }
        );
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Delete project
app.delete('/api/projects/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;

        // First delete all project files
        db.run('DELETE FROM project_files WHERE project_id = ? AND user_id = ?', [id, req.userId], (err) => {
            if (err) {
                return res.status(500).json({ error: '删除项目文件失败' });
            }

            // Then delete the project
            db.run(
                'DELETE FROM projects WHERE id = ? AND user_id = ?',
                [id, req.userId],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: '删除失败' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: '项目不存在或无权访问' });
                    }

                    res.json({ message: '项目删除成功' });
                }
            );
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==========================================
// Project Files API
// ==========================================

// Get project files
app.get('/api/projects/:id/files', requireAuth, (req, res) => {
    try {
        const { id } = req.params;

        // First verify user owns the project
        db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [id, req.userId], (err, project) => {
            if (err || !project) {
                return res.status(404).json({ error: '项目不存在或无权访问' });
            }

            db.all(
                'SELECT * FROM project_files WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC',
                [id, req.userId],
                (err, files) => {
                    if (err) {
                        return res.status(500).json({ error: '查询失败' });
                    }

                    res.json({ files });
                }
            );
        });
    } catch (error) {
        console.error('Get project files error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Add file to project
app.post('/api/projects/:id/files', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { fileType, fileUrl, fileName, generationRecordId } = req.body;

        if (!fileType || !fileUrl) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // Verify user owns the project
        db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [id, req.userId], (err, project) => {
            if (err || !project) {
                return res.status(404).json({ error: '项目不存在或无权访问' });
            }

            db.run(
                'INSERT INTO project_files (project_id, user_id, file_type, file_url, file_name, generation_record_id) VALUES (?, ?, ?, ?, ?, ?)',
                [id, req.userId, fileType, fileUrl, fileName, generationRecordId],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: '添加文件失败' });
                    }

                    res.json({
                        message: '文件添加成功',
                        file: {
                            id: this.lastID,
                            project_id: id,
                            user_id: req.userId,
                            file_type: fileType,
                            file_url: fileUrl,
                            file_name: fileName,
                            generation_record_id: generationRecordId
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error('Add project file error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Delete project file
app.delete('/api/projects/:projectId/files/:fileId', requireAuth, (req, res) => {
    try {
        const { projectId, fileId } = req.params;

        db.run(
            'DELETE FROM project_files WHERE id = ? AND project_id = ? AND user_id = ?',
            [fileId, projectId, req.userId],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: '删除失败' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: '文件不存在或无权访问' });
                }

                res.json({ message: '文件删除成功' });
            }
        );
    } catch (error) {
        console.error('Delete project file error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==========================================
// User Statistics API
// ==========================================

// Get user statistics
app.get('/api/user/stats', requireAuth, (req, res) => {
    try {
        const userId = req.userId;
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Get monthly generation count
        db.get(
            `SELECT COUNT(*) as count FROM generation_records 
             WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?`,
            [userId, currentMonth],
            (err, monthlyGen) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                // Get membership info
                db.get(
                    'SELECT * FROM user_membership WHERE user_id = ?',
                    [userId],
                    (err, membership) => {
                        if (err) {
                            return res.status(500).json({ error: '查询失败' });
                        }

                        // If no membership record, create one
                        if (!membership) {
                            db.run(
                                'INSERT INTO user_membership (user_id) VALUES (?)',
                                [userId],
                                function (err) {
                                    if (err) {
                                        return res.status(500).json({ error: '创建会员信息失败' });
                                    }

                                    // Return default membership
                                    membership = {
                                        user_id: userId,
                                        membership_level: 'free',
                                        total_recharge_amount: 0,
                                        monthly_quota: 100,
                                        monthly_used: monthlyGen.count,
                                        bonus_quota: 0
                                    };

                                    sendStatsResponse();
                                }
                            );
                        } else {
                            sendStatsResponse();
                        }

                        function sendStatsResponse() {
                            // Get total login duration
                            db.get(
                                'SELECT total_login_duration FROM users WHERE id = ?',
                                [userId],
                                (err, user) => {
                                    if (err) {
                                        return res.status(500).json({ error: '查询失败' });
                                    }

                                    // Get monthly login duration
                                    db.get(
                                        `SELECT SUM(duration_minutes) as monthly_duration FROM login_sessions 
                                         WHERE user_id = ? AND strftime('%Y-%m', login_time) = ?`,
                                        [userId, currentMonth],
                                        (err, monthlyLogin) => {
                                            if (err) {
                                                return res.status(500).json({ error: '查询失败' });
                                            }

                                            res.json({
                                                monthlyGenerations: monthlyGen.count,
                                                monthlyQuota: membership.monthly_quota,
                                                remainingQuota: membership.monthly_quota - monthlyGen.count + membership.bonus_quota,
                                                monthlyDuration: monthlyLogin?.monthly_duration || 0,
                                                totalDuration: user?.total_login_duration || 0,
                                                totalGenerations: membership.monthly_used,
                                                membershipLevel: membership.membership_level,
                                                totalRecharge: membership.total_recharge_amount
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            }
        );
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Get user generation history
app.get('/api/user/generations', requireAuth, (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        db.all(
            'SELECT * FROM generation_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [req.userId, parseInt(limit), parseInt(offset)],
            (err, records) => {
                if (err) {
                    return res.status(500).json({ error: '查询失败' });
                }

                // Get total count
                db.get(
                    'SELECT COUNT(*) as total FROM generation_records WHERE user_id = ?',
                    [req.userId],
                    (err, countResult) => {
                        if (err) {
                            return res.status(500).json({ error: '查询失败' });
                        }

                        res.json({
                            records,
                            total: countResult.total
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Get user generations error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==========================================
// Image Storage & Management
// ==========================================

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

// Save generated image
app.post('/api/images/save', requireAuth, async (req, res) => {
    try {
        const { imageData, categoryId, subtypeId, styleId, prompt, projectId } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        const userId = req.userId; // Get from auth middleware

        // Generate filename
        const timestamp = Date.now();
        const filename = `gen_${userId}_${timestamp}.png`;
        const filepath = join(uploadsPath, filename);

        // Save image (assuming base64 data)
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        await promisify(fs.writeFile)(filepath, buffer);

        // Save to database
        db.run(
            'INSERT INTO generation_records (user_id, category_id, subtype_id, style_id, prompt, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, categoryId, subtypeId, styleId, prompt, `/uploads/${filename}`],
            async function (err) {
                if (err) {
                    return res.status(500).json({ error: '保存记录失败' });
                }

                const generationId = this.lastID;

                // If projectId is provided, add to project files
                if (projectId) {
                    db.run(
                        'INSERT INTO project_files (project_id, user_id, file_type, file_url, file_name, generation_record_id) VALUES (?, ?, ?, ?, ?, ?)',
                        [projectId, userId, 'generated_image', `/uploads/${filename}`, filename, generationId],
                        (err) => {
                            if (err) {
                                console.error('Error adding to project files:', err);
                            }
                        }
                    );
                }

                // Clean old images (keep only 500 most recent)
                await cleanOldImages();

                res.json({
                    message: '图片保存成功',
                    id: generationId,
                    imageUrl: `/uploads/${filename}`
                });
            }
        );
    } catch (error) {
        console.error('Save image error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Clean old images - keep only 500 most recent
async function cleanOldImages() {
    try {
        // Get all generation records ordered by creation time
        db.all(
            'SELECT id, image_url FROM generation_records ORDER BY created_at DESC',
            async (err, records) => {
                if (err || !records) return;

                // If more than 500 records, delete old ones
                if (records.length > 500) {
                    const recordsToDelete = records.slice(500);

                    for (const record of recordsToDelete) {
                        // Delete file
                        if (record.image_url) {
                            const filename = record.image_url.replace('/uploads/', '');
                            const filepath = join(uploadsPath, filename);

                            try {
                                await unlink(filepath);
                                console.log(`🗑️  Deleted old image: ${filename}`);
                            } catch (err) {
                                // File might not exist, ignore error
                            }
                        }

                        // Delete database record
                        db.run('DELETE FROM generation_records WHERE id = ?', [record.id]);
                    }

                    console.log(`🧹 Cleaned ${recordsToDelete.length} old images`);
                }
            }
        );
    } catch (error) {
        console.error('Clean old images error:', error);
    }
}

// ==========================================
// Gemini API Proxy (Security Layer)
// ==========================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TEXT_GEN_URL = "https://cdn.12ai.org/v1beta/models/gemini-1.5-flash:generateContent";
const IMAGE_GEN_URL = "https://new.12ai.org/v1beta/models/gemini-3-pro-image-preview:generateContent";

// Proxy for text generation
app.post('/api/gemini/generate-text', requireAuth, async (req, res) => {
    try {
        const { instruction } = req.body;

        if (!instruction) {
            return res.status(400).json({ error: '缺少instruction参数' });
        }

        const response = await fetch(`${TEXT_GEN_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: instruction }] }]
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Gemini text generation error:', error);
        res.status(500).json({ error: '生成失败' });
    }
});

// Proxy for image generation
app.post('/api/gemini/generate-image', requireAuth, async (req, res) => {
    try {
        const { prompt, base64Image } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: '缺少prompt参数' });
        }

        const parts = [{ text: prompt }];

        if (base64Image) {
            parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image.split(',')[1]
                }
            });
        }

        const response = await fetch(`${IMAGE_GEN_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: parts }],
                generationConfig: { responseModalities: ["IMAGE"] },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Gemini image generation error:', error);
        res.status(500).json({ error: '生成失败' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
