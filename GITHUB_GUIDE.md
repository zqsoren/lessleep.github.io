# GitHub上传指南 📤

## 📋 上传前检查清单

### ✅ 必须确认的事项:

1. **`.gitignore`已配置** ✅
   - 已排除`.env`文件
   - 已排除`node_modules`
   - 已排除数据库文件
   - 已排除uploads文件夹内容

2. **敏感信息已移除** ✅
   - API Key在`.env`中(不会被上传)
   - 前端代码不包含API Key
   - JWT Secret在`.env`中

3. **文档已创建** ✅
   - README.md
   - DEPLOYMENT.md

---

## 🚀 上传步骤

### 方法A: 使用GitHub Desktop (推荐新手)

1. **下载GitHub Desktop**
   - 访问: https://desktop.github.com/
   - 下载并安装

2. **登录GitHub账号**
   - 打开GitHub Desktop
   - File -> Options -> Accounts -> Sign in

3. **添加本地仓库**
   - File -> Add local repository
   - 选择: `C:\Users\Lenovo\Desktop\lesleep`
   - 点击"Add repository"

4. **创建GitHub仓库**
   - 点击"Publish repository"
   - 仓库名: `zzzap` (或您喜欢的名字)
   - 描述: "建筑AI工作室 - AI-powered architectural design platform"
   - ⚠️ **取消勾选** "Keep this code private" (如果想公开)
   - 点击"Publish repository"

5. **完成!**
   - 代码已上传到GitHub
   - 访问: `https://github.com/your-username/zzzap`

---

### 方法B: 使用命令行 (推荐有经验者)

1. **初始化Git仓库**
```bash
cd C:\Users\Lenovo\Desktop\lesleep
git init
```

2. **添加所有文件**
```bash
git add .
```

3. **检查将要提交的文件**
```bash
git status
```
确认`.env`和`database.db`**不在**列表中!

4. **提交到本地仓库**
```bash
git commit -m "Initial commit: Zzzap建筑AI工作室"
```

5. **在GitHub创建远程仓库**
   - 访问: https://github.com/new
   - 仓库名: `zzzap`
   - 描述: "建筑AI工作室"
   - 选择Public或Private
   - **不要**勾选"Initialize with README"
   - 点击"Create repository"

6. **连接远程仓库**
```bash
git remote add origin https://github.com/your-username/zzzap.git
git branch -M main
git push -u origin main
```

7. **完成!**

---

## 📁 将会上传的文件列表

### ✅ 会上传:
```
lesleep/
├── pages/              ✅ 所有页面组件
├── components/         ✅ 所有组件
├── contexts/           ✅ AuthContext等
├── data/               ✅ 数据文件
├── server/
│   ├── server.js       ✅ 后端代码
│   └── uploads/
│       └── .gitkeep    ✅ 保留文件夹结构
├── types.ts            ✅
├── App.tsx             ✅
├── main.tsx            ✅
├── index.html          ✅
├── index.css           ✅
├── package.json        ✅
├── package-lock.json   ✅
├── tsconfig.json       ✅
├── vite.config.ts      ✅
├── .gitignore          ✅
├── README.md           ✅
└── DEPLOYMENT.md       ✅
```

### ❌ 不会上传(被.gitignore排除):
```
❌ .env                    # API Key和密钥
❌ .env.local
❌ .env.production
❌ node_modules/           # 依赖包
❌ dist/                   # 打包文件
❌ server/database.db      # 数据库
❌ server/uploads/*        # 上传的图片
```

---

## 🔍 上传后验证

1. **访问GitHub仓库**
   - https://github.com/your-username/zzzap

2. **检查关键文件**
   - ✅ README.md显示正常
   - ✅ 代码文件都在
   - ❌ `.env`文件**不应该**出现
   - ❌ `database.db`**不应该**出现

3. **搜索敏感信息**
   - 在GitHub仓库中搜索您的API Key
   - 确保**找不到**任何结果

---

## 🔄 后续更新代码

### 使用GitHub Desktop:
1. 修改代码后
2. 打开GitHub Desktop
3. 查看Changes
4. 填写Commit message
5. 点击"Commit to main"
6. 点击"Push origin"

### 使用命令行:
```bash
git add .
git commit -m "描述你的更改"
git push
```

---

## ⚠️ 重要提醒

### 如果不小心上传了.env文件:

1. **立即删除文件**
```bash
git rm .env
git commit -m "Remove sensitive .env file"
git push
```

2. **更换所有密钥**
   - 生成新的Gemini API Key
   - 更换JWT_SECRET
   - 更新本地`.env`文件

3. **清理Git历史** (高级)
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

---

## 📊 推荐的仓库设置

### 添加Topics (标签):
- `react`
- `typescript`
- `nodejs`
- `ai`
- `gemini`
- `architecture`
- `design-tool`

### 添加Description:
```
🏛️ 建筑AI工作室 - 基于Gemini API的智能建筑设计辅助平台
```

### 设置License:
- 推荐: MIT License

---

## ✅ 完成后

您的代码已安全上传到GitHub!

**下一步**:
1. 分享您的项目: `https://github.com/your-username/zzzap`
2. 准备部署到服务器 (参考DEPLOYMENT.md)
3. 邀请其他开发者协作

**注意**: 
- 定期备份数据库
- 不要在GitHub Issues中泄露API Key
- Pull Request中也要注意不要包含敏感信息
