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
// CORS configuration - allow both www and non-www domains
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://zzzap.site',
        'https://www.zzzap.site'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_login_duration INTEGER DEFAULT 0,
            last_heartbeat DATETIME,
            membership_level TEXT DEFAULT 'free',
            monthly_remaining_generations INTEGER DEFAULT 100,
            gift_generations INTEGER DEFAULT 0
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
            addColumnIfNotExists('users', 'total_login_duration', 'INTEGER DEFAULT 0'); // Accumulated seconds
            addColumnIfNotExists('users', 'last_heartbeat', 'DATETIME');
            addColumnIfNotExists('users', 'membership_level', 'TEXT DEFAULT "free"');
            addColumnIfNotExists('users', 'monthly_remaining_generations', 'INTEGER DEFAULT 100');
            addColumnIfNotExists('users', 'gift_generations', 'INTEGER DEFAULT 0');
        }
    });

    // Prompt Categories Table (Level 1)
    db.run(`
        CREATE TABLE IF NOT EXISTS prompt_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
        )
    `, (err) => {
        if (err) console.error('Error creating prompt_categories table:', err);
        else console.log('Prompt categories table ready');
    });

    // Prompt Subtypes Table (Level 2)
    db.run(`
        CREATE TABLE IF NOT EXISTS prompt_subtypes (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            name TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES prompt_categories(id)
        )
    `, (err) => {
        if (err) console.error('Error creating prompt_subtypes table:', err);
        else console.log('Prompt subtypes table ready');
    });

    // Prompt Styles Table (Level 3)
    db.run(`
        CREATE TABLE IF NOT EXISTS prompt_styles (
            id TEXT PRIMARY KEY,
            subtype_id TEXT NOT NULL,
            name TEXT NOT NULL,
            preview TEXT,
            description TEXT,
            prompt_content TEXT,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (subtype_id) REFERENCES prompt_subtypes(id)
        )
    `, (err) => {
        if (err) console.error('Error creating prompt_styles table:', err);
        else console.log('Prompt styles table ready');
        addColumnIfNotExists('prompt_styles', 'system_prompt_template', 'TEXT');
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

            // Upgrade table: Add new columns if they don't exist
            const columns = [
                'base_json TEXT',
                'user_desc TEXT',
                'advanced_settings TEXT',
                'aspect_ratio TEXT',
                'full_prompt TEXT'
            ];
            columns.forEach(col => {
                db.run(`ALTER TABLE generation_records ADD COLUMN ${col}`, (err) => {
                    // Ignore error if column already exists
                });
            });
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

    // Advanced Settings table for Generator
    db.run(`
        CREATE TABLE IF NOT EXISTS advanced_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            style_id TEXT NOT NULL UNIQUE,
            config_json TEXT NOT NULL,
            is_published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (style_id) REFERENCES prompt_styles(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating advanced_settings table:', err);
        } else {
            console.log('Advanced settings table ready');
        }
    });
}
// Helper function to add column if not exists
function addColumnIfNotExists(tableName, columnName, columnDefinition) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error(`Error adding column ${columnName} to ${tableName}:`, err);
        }
    });
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: '请先登录' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: '登录已过期，请重新登录' });
        req.user = user;
        next();
    });
};



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

// Import routes
import userRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import promptRouter from './routes/prompts.js';

// Mount routes
app.use('/api/user', userRouter(db, requireAuth));
app.use('/api/admin', adminRouter(db, requireAuth));
app.use('/api/prompts', promptRouter(db, requireAuth));

// ==========================================
// User API Routes (Legacy/Others)
// ==========================================



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
        const { imageData, categoryId, subtypeId, styleId, prompt, projectId,
            baseJson, userDesc, advancedSettings, aspectRatio, fullPrompt // New fields
        } = req.body;

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

        console.log(`[DEBUG] /api/images/save - Received request. User: ${userId}`);
        console.log(`[DEBUG] Fields: baseJson=${baseJson ? 'YES' : 'NO'}, fullPrompt=${fullPrompt ? 'YES' : 'NO'}, aspect=${aspectRatio}`);

        // Save to database
        db.run(
            `INSERT INTO generation_records (
                user_id, category_id, subtype_id, style_id, prompt, image_url,
                base_json, user_desc, advanced_settings, aspect_ratio, full_prompt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, categoryId, subtypeId, styleId, prompt, `/uploads/${filename}`,
                baseJson, userDesc, advancedSettings, aspectRatio, fullPrompt
            ],
            async function (err) {
                if (err) {
                    console.error('[ERROR] Insert generation_records failed:', err.message);
                    return res.status(500).json({ error: '保存记录失败' });
                }
                const generationId = this.lastID;
                console.log(`[DEBUG] Inserted generation_record ID: ${generationId}`);

                // Update user generation stats
                db.run(
                    'UPDATE users SET generated_count = generated_count + 1, month_generated_count = month_generated_count + 1 WHERE id = ?',
                    [userId],
                    function (err) {
                        if (err) console.error('[ERROR] Failed to update user stats:', err);
                        else console.log(`[DEBUG] Updated user stats for user ${userId}. Changes: ${this.changes}`);
                    }
                );

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
// 🟢 修复：将文本生成回退到稳定的 gemini-1.5-flash 模型，以修复"AI未返回结果"的错误
// 提示词优化不需要超强模型，Flash 足够快且稳定
// 尝试使用 user 提供的模型 gemini-2.5-pro-c (通过 new.12ai.org)
const TEXT_GEN_URL = "https://new.12ai.org/v1beta/models/gemini-2.5-pro-c:generateContent";
// 用户指定的新版生图模型 (保持不变)
const IMAGE_GEN_URL = "https://new.12ai.org/v1beta/models/gemini-3-pro-image-preview-4k:generateContent";

// Proxy for text generation
app.post('/api/gemini/generate-text', requireAuth, async (req, res) => {
    try {
        const { instruction } = req.body;

        if (!instruction) {
            return res.status(400).json({ error: '缺少instruction参数' });
        }

        console.log('📡 Sending to Gemini Text Model:', TEXT_GEN_URL, instruction.substring(0, 100) + '...');

        // 增加 timeout 设置 (虽然 fetch 原生不支持，但可以通过 AbortController 实现，或者依赖 node 的 fetch 默认超时)
        const response = await fetch(`${TEXT_GEN_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: instruction }]
                }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        // 🛡️ 先读取文本，避免直接 json() 报错
        const responseText = await response.text();
        console.log('✅ Gemini Raw Response:', responseText.substring(0, 1000)); // 打印前1000字符

        try {
            const data = JSON.parse(responseText);
            if (data.error) {
                console.error('❌ Gemini API Error:', data.error);
            }
            res.json(data);
        } catch (jsonError) {
            console.error('❌ Failed to parse Gemini response as JSON:', responseText);
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }

    } catch (error) {
        console.error('Gemini text generation error:', error);
        res.status(500).json({ error: '生成失败: ' + error.message });
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

// ==========================================
// 🌳 提示词管理系统 API (Prompt Management)
// ==========================================

// 1. 获取完整分类树 (供 Generator 使用)
app.get('/api/prompts/tree', (req, res) => {
    const query = `
        SELECT 
            c.id as cat_id, c.name as cat_name, c.sort_order as cat_sort,
            s.id as sub_id, s.name as sub_name, s.icon as sub_icon, s.sort_order as sub_sort,
            st.id as style_id, st.name as style_name, st.preview as style_preview, 
            st.description as style_desc, st.prompt_content as style_prompt, st.sort_order as style_sort
        FROM prompt_categories c
        LEFT JOIN prompt_subtypes s ON c.id = s.category_id
        LEFT JOIN prompt_styles st ON s.id = st.subtype_id
        ORDER BY c.sort_order, s.sort_order, st.sort_order
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const tree = [];
        const catMap = new Map();
        const subMap = new Map();

        rows.forEach(row => {
            // Level 1: Category
            if (!catMap.has(row.cat_id)) {
                const cat = {
                    id: row.cat_id,
                    name: row.cat_name,
                    subtypes: []
                };
                catMap.set(row.cat_id, cat);
                tree.push(cat);
            }

            // Level 2: Subtype
            if (row.sub_id) {
                const cat = catMap.get(row.cat_id);
                // Use composite key to avoid collision if subtype ids are not unique globally (though they should be)
                const subKey = `${row.cat_id}-${row.sub_id}`;

                if (!subMap.has(subKey)) {
                    const sub = {
                        id: row.sub_id,
                        name: row.sub_name,
                        icon: row.sub_icon,
                        styles: []
                    };
                    subMap.set(subKey, sub);
                    cat.subtypes.push(sub);
                }

                // Level 3: Style
                if (row.style_id) {
                    const sub = subMap.get(subKey);
                    sub.styles.push({
                        id: row.style_id,
                        name: row.style_name,
                        preview: row.style_preview, // Should be a URL or base64
                        description: row.style_desc,
                        prompt: row.style_prompt
                    });
                }
            }
        });

        res.json(tree);
    });
});

// 2. Admin APIs for Management

// --- Categories (L1) ---
app.get('/api/admin/categories', authenticateToken, (req, res) => {
    db.all('SELECT * FROM prompt_categories ORDER BY sort_order', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/categories', authenticateToken, (req, res) => {
    const { id, name, sort_order } = req.body;
    db.run('INSERT INTO prompt_categories (id, name, sort_order) VALUES (?, ?, ?)', [id, name, sort_order || 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, name, sort_order });
    });
});

app.delete('/api/admin/categories/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    // Cascade delete would be ideal, but for now manual cleanup or assume DB constraints (which we didn't strictly set with ON DELETE CASCADE)
    // For safety, let's just delete the category. Real app should check for children.
    db.run('DELETE FROM prompt_categories WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- Subtypes (L2) ---
app.get('/api/admin/subtypes', authenticateToken, (req, res) => {
    const { category_id } = req.query;
    let query = 'SELECT * FROM prompt_subtypes';
    let params = [];
    if (category_id) {
        query += ' WHERE category_id = ?';
        params.push(category_id);
    }
    query += ' ORDER BY sort_order';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/subtypes', authenticateToken, (req, res) => {
    const { id, category_id, name, icon, sort_order } = req.body;
    db.run('INSERT INTO prompt_subtypes (id, category_id, name, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
        [id, category_id, name, icon, sort_order || 0], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, category_id, name, icon });
        });
});

app.delete('/api/admin/subtypes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM prompt_subtypes WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- Styles (L3) ---
app.get('/api/admin/styles', authenticateToken, (req, res) => {
    const { subtype_id } = req.query;
    let query = 'SELECT * FROM prompt_styles';
    let params = [];
    if (subtype_id) {
        query += ' WHERE subtype_id = ?';
        params.push(subtype_id);
    }
    query += ' ORDER BY sort_order';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/styles', authenticateToken, (req, res) => {
    const { id, subtype_id, name, description, preview, prompt_content, sort_order, system_prompt_template } = req.body;
    db.run(`INSERT INTO prompt_styles (id, subtype_id, name, description, preview, prompt_content, sort_order, system_prompt_template) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, subtype_id, name, description, preview, prompt_content, sort_order || 0, system_prompt_template], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name });
        });
});

app.put('/api/admin/styles/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { prompt_content, name, description, preview } = req.body;

    // Dynamic update construction
    let updates = [];
    let params = [];
    if (prompt_content !== undefined) { updates.push('prompt_content = ?'); params.push(prompt_content); }
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (preview !== undefined) { updates.push('preview = ?'); params.push(preview); }
    if (req.body.system_prompt_template !== undefined) { updates.push('system_prompt_template = ?'); params.push(req.body.system_prompt_template); }

    if (updates.length === 0) return res.json({ success: true }); // Nothing to update

    params.push(id);

    db.run(`UPDATE prompt_styles SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/admin/styles/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM prompt_styles WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ==========================================
// 🎛️ 高级设置管理 API (Advanced Settings)
// ==========================================

// 1. 获取高级设置配置（管理员用）
app.get('/api/admin/advanced-settings/:styleId', authenticateToken, (req, res) => {
    const { styleId } = req.params;

    const query = `SELECT * FROM advanced_settings WHERE style_id = ?`;

    db.get(query, [styleId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!row) {
            // 如果没有配置，返回空配置
            return res.json({
                styleId,
                config: { groups: [] },
                isPublished: false,
                updatedAt: null
            });
        }

        res.json({
            styleId: row.style_id,
            config: JSON.parse(row.config_json),
            isPublished: row.is_published === 1,
            updatedAt: row.updated_at
        });
    });
});

// 2. 保存高级设置配置（草稿）
app.put('/api/admin/advanced-settings/:styleId', authenticateToken, (req, res) => {
    const { styleId } = req.params;
    const { config } = req.body;

    if (!config) {
        return res.status(400).json({ error: 'Config is required' });
    }

    const configJson = JSON.stringify(config);
    const now = new Date().toISOString();

    // 先检查是否存在
    db.get('SELECT id FROM advanced_settings WHERE style_id = ?', [styleId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // 更新现有配置
            db.run(
                'UPDATE advanced_settings SET config_json = ?, updated_at = ? WHERE style_id = ?',
                [configJson, now, styleId],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, message: '配置已保存' });
                }
            );
        } else {
            // 插入新配置
            db.run(
                'INSERT INTO advanced_settings (style_id, config_json, is_published, updated_at) VALUES (?, ?, 0, ?)',
                [styleId, configJson, now],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, message: '配置已创建' });
                }
            );
        }
    });
});

// 3. 发布高级设置配置
app.post('/api/admin/advanced-settings/:styleId/publish', authenticateToken, (req, res) => {
    const { styleId } = req.params;

    db.run(
        'UPDATE advanced_settings SET is_published = 1, updated_at = ? WHERE style_id = ?',
        [new Date().toISOString(), styleId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (this.changes === 0) {
                return res.status(404).json({ error: '配置不存在，请先保存配置' });
            }

            res.json({ success: true, message: '配置已发布' });
        }
    );
});

// 4. 获取已发布的高级设置（Generator 使用，无需认证）
app.get('/api/advanced-settings/:styleId', (req, res) => {
    const { styleId } = req.params;

    const query = `SELECT config_json FROM advanced_settings WHERE style_id = ? AND is_published = 1`;

    db.get(query, [styleId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!row) {
            // 如果没有已发布的配置，返回空配置
            return res.json({ config: { groups: [] } });
        }

        res.json({
            config: JSON.parse(row.config_json)
        });
    });
});

// --- Generations Management ---
app.get('/api/admin/generations', authenticateToken, (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    db.all(
        `SELECT g.*, u.username 
         FROM generation_records g 
         LEFT JOIN users u ON g.user_id = u.id 
         ORDER BY g.created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, records) => {
            if (err) return res.status(500).json({ error: err.message });

            db.get('SELECT COUNT(*) as total FROM generation_records', [], (err, count) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    records,
                    totalPages: Math.ceil(count.total / limit),
                    currentPage: parseInt(page)
                });
            });
        }
    );
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
