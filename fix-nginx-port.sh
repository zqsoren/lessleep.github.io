#!/bin/bash
# Nginx 端口修复脚本

echo "=== 开始修复 Nginx 配置 ==="

# 1. 备份原配置
echo "1. 备份原配置..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# 2. 修改端口
echo "2. 修改端口 3000 -> 3001..."
sudo sed -i 's/:3000/:3001/g' /etc/nginx/sites-available/default

# 3. 显示修改后的配置
echo "3. 修改后的配置:"
sudo grep -n "proxy_pass" /etc/nginx/sites-available/default

# 4. 测试配置
echo "4. 测试 Nginx 配置..."
sudo nginx -t

# 5. 重启 Nginx
if [ $? -eq 0 ]; then
    echo "5. 配置正确，重启 Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx 已重启"
else
    echo "❌ 配置有误，恢复备份..."
    sudo cp /etc/nginx/sites-available/default.backup /etc/nginx/sites-available/default
    exit 1
fi

# 6. 验证
echo "6. 验证修复..."
sleep 2
curl -I https://zzzap.site/api/auth/verify 2>&1 | head -5

echo "=== 修复完成 ==="
