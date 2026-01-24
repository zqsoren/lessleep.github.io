# 部署指南 - Zzzap建筑AI工作室

## 📋 部署前检查清单

### 1. 安全检查 ✅
- [x] API Key已移到后端.env文件
- [x] 前端代码不包含任何敏感信息
- [x] .gitignore包含.env文件
- [x] 所有AI调用通过后端代理

### 2. 服务器要求
- **推荐**: 香港/新加坡VPS
- **系统**: Ubuntu 20.04+
- **内存**: 至少2GB RAM
- **存储**: 至少20GB
- **Node.js**: v18+

---

## 🚀 部署步骤

### 步骤1: 准备代码

#### 前端打包
```bash
cd c:\Users\Lenovo\Desktop\lesleep
npm run build
```
这会生成`dist`文件夹,包含所有前端静态文件。

#### 后端准备
确保以下文件/文件夹准备好上传:
- `server/` (整个文件夹)
- `package.json`
- `.env.production` (见下方)

### 步骤2: 配置生产环境变量

创建`.env.production`文件:
```env
PORT=3001
JWT_SECRET=your-production-secret-key-change-this-to-random-string
VITE_API_URL=https://your-domain.com
GEMINI_API_KEY=sk-c4BEWt1Fjoalqgw41PCMVi3KjWbClIv7cd96fh82dzbrpycO
```

**重要**: 
- 修改`JWT_SECRET`为随机字符串
- 修改`VITE_API_URL`为你的域名
- **不要**把`.env.production`上传到GitHub

### 步骤3: 服务器环境配置

SSH连接到服务器后:

```bash
# 1. 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装PM2 (进程管理器)
sudo npm install pm2 -g

# 3. 安装Nginx (反向代理)
sudo apt update
sudo apt install nginx -y
```

### 步骤4: 上传代码

使用FileZilla或scp上传:
```bash
# 上传后端
scp -r server/ user@your-server:/var/www/zzzap/
scp package.json user@your-server:/var/www/zzzap/
scp .env.production user@your-server:/var/www/zzzap/.env

# 上传前端
scp -r dist/ user@your-server:/var/www/zzzap/frontend/
```

### 步骤5: 启动后端

```bash
cd /var/www/zzzap
npm install --production
pm2 start server/server.js --name "zzzap-backend"
pm2 save
pm2 startup  # 设置开机自启
```

### 步骤5.1: 数据库迁移与配置同步 (增量更新必做)

如果你是更新现有服务，**上传完代码后**请执行以下命令来升级数据库结构并同步 Prompt 配置，而不会丢失用户数据：

```bash
# 1. 升级数据库表结构 (安全操作，仅添加新列/新表)
node server/update_db_schema.cjs

# 2. 同步最新的 Prompt 和高级设置
node server/import_config_data.cjs

# 3. 重启服务使生效
pm2 restart zzzap-backend
```

### 步骤6: 配置Nginx

创建配置文件 `/etc/nginx/sites-available/zzzap`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/zzzap/frontend;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传的图片
    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/zzzap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤7: 配置HTTPS (可选但推荐)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 安全最佳实践

### 1. 防火墙配置
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. 定期备份数据库
```bash
# 创建备份脚本
cat > /var/www/zzzap/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/zzzap/server/database.db /var/www/zzzap/backups/db_$DATE.db
# 只保留最近7天的备份
find /var/www/zzzap/backups -name "db_*.db" -mtime +7 -delete
EOF

chmod +x /var/www/zzzap/backup.sh

# 添加到crontab (每天凌晨2点备份)
crontab -e
# 添加: 0 2 * * * /var/www/zzzap/backup.sh
```

### 3. 监控日志
```bash
# 查看后端日志
pm2 logs zzzap-backend

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 性能优化

### 1. 启用Gzip压缩
在Nginx配置中添加:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 2. 缓存静态资源
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🐛 常见问题

### 问题1: API调用失败
**检查**: 
- 后端是否运行: `pm2 status`
- 环境变量是否正确: `cat /var/www/zzzap/.env`
- 防火墙是否允许3001端口

### 问题2: 图片无法显示
**检查**:
- uploads文件夹权限: `chmod 755 /var/www/zzzap/server/uploads`
- Nginx配置是否正确代理/uploads路径

### 问题3: 数据库错误
**检查**:
- database.db文件是否存在
- 文件权限: `chmod 644 /var/www/zzzap/server/database.db`

---

## 📝 维护命令

```bash
# 重启后端
pm2 restart zzzap-backend

# 重启Nginx
sudo systemctl restart nginx

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 清理旧图片 (超过500张会自动清理)
# 已在代码中实现自动清理
```

---

## ✅ 部署完成检查

- [ ] 网站可以通过域名访问
- [ ] 登录/注册功能正常
- [ ] AI生成功能正常
- [ ] 图片上传和显示正常
- [ ] 后台管理功能正常
- [ ] HTTPS证书已配置
- [ ] 数据库备份已设置
- [ ] PM2开机自启已配置

---

## 🆘 紧急联系

如遇到问题:
1. 查看日志: `pm2 logs`
2. 检查服务状态: `pm2 status`
3. 重启服务: `pm2 restart all`

**祝部署顺利!** 🎉
