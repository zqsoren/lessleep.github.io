# Zzzap - 建筑AI工作室 🏛️

一个基于AI的建筑设计辅助平台,提供智能图片生成、项目管理和设计分析功能。

## ✨ 主要功能

- 🎨 **AI图片生成**: 基于Gemini API的建筑设计图生成
- 📁 **项目管理**: 创建和管理设计项目
- 🔐 **用户系统**: 完整的登录/注册和权限管理
- 👨‍💼 **后台管理**: 管理员可管理用户、提示词和生成记录
- 💾 **本地存储**: 自动保存生成的图片(最多500张)

## 🛠️ 技术栈

**前端**:
- React + TypeScript
- Vite
- TailwindCSS (通过CSS实现)

**后端**:
- Node.js + Express
- SQLite数据库
- JWT认证
- bcrypt密码加密

**AI服务**:
- Google Gemini API (通过后端代理)

## 📦 安装

### 前置要求
- Node.js 18+
- npm

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/your-username/zzzap.git
cd zzzap
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量

创建`.env`文件:
```env
PORT=3001
JWT_SECRET=your-secret-key
VITE_API_URL=http://localhost:3001
GEMINI_API_KEY=your-gemini-api-key
```

⚠️ **重要**: 
- 将`your-gemini-api-key`替换为您的Gemini API Key
- 不要将`.env`文件上传到GitHub

4. 启动开发服务器

```bash
# 启动前端 (终端1)
npm run dev

# 启动后端 (终端2)
node server/server.js
```

5. 访问应用
- 前端: http://localhost:5173
- 后端API: http://localhost:3001

## 🚀 部署

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

**推荐服务器**: 香港/新加坡VPS (阿里云/腾讯云)

## 📁 项目结构

```
zzzap/
├── pages/              # 页面组件
│   ├── Dashboard.tsx   # 仪表盘
│   ├── Generator.tsx   # AI生成器
│   ├── Projects.tsx    # 项目列表
│   ├── Editor.tsx      # 编辑器
│   └── Admin.tsx       # 后台管理
├── components/         # 可复用组件
│   ├── Sidebar.tsx     # 侧边栏
│   ├── LoginModal.tsx  # 登录模态框
│   └── admin/          # 管理组件
├── contexts/           # React Context
│   └── AuthContext.tsx # 认证上下文
├── server/             # 后端代码
│   ├── server.js       # Express服务器
│   ├── database.db     # SQLite数据库
│   └── uploads/        # 上传文件存储
├── data/               # 静态数据
├── types.ts            # TypeScript类型
└── App.tsx             # 主应用组件
```

## 🔒 安全特性

- ✅ API Key存储在后端环境变量
- ✅ 所有AI调用通过后端代理
- ✅ JWT Token认证
- ✅ 密码bcrypt加密
- ✅ 管理员权限控制

## 📝 开发说明

### 添加新的AI提示词模板
1. 在后台管理 -> 提示词管理中添加
2. 或直接在数据库`prompt_templates`表中添加

### 修改用户权限
```sql
-- 设置用户为管理员
UPDATE users SET role = 'admin' WHERE username = 'your-username';
```

### 清理旧图片
系统会自动保留最新500张图片,旧图片会被自动删除。

## 🐛 常见问题

**Q: AI生成失败?**
A: 检查Gemini API Key是否正确配置在`.env`文件中

**Q: 登录后看不到后台管理入口?**
A: 确保用户的role字段为'admin'

**Q: 图片无法显示?**
A: 检查`server/uploads`文件夹权限

## 📄 许可证

MIT License

## 👨‍💻 作者

Zhang Qing

---

**注意**: 此项目仅供学习和研究使用。
