@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 开始部署 (简易模式)
echo ========================================
echo.
echo [1/4] 测试连接并创建目录...
echo 👉 请输入密码 (验证连接):
ssh -o StrictHostKeyChecking=no ubuntu@152.32.131.4 "mkdir -p /home/ubuntu/lessleep && echo '✅ 连接成功，目录已准备好'"

if errorlevel 1 (
    echo.
    echo ❌ 连接失败！可能是密码错误，或者 SSH 服务异常。
    echo 请先尝试在终端手动运行: ssh ubuntu@152.32.131.4
    pause
    exit /b
)

echo.
echo [2/4] 上传部署包...
echo 👉 请再次输入密码 (上传):
scp -o StrictHostKeyChecking=no lesleep-deploy.zip ubuntu@152.32.131.4:/home/ubuntu/lessleep/

if errorlevel 1 (
    echo.
    echo ❌ 上传失败！请检查密码是否正确，或目标目录是否存在。
    pause
    exit /b
)

echo.
echo [3/4] 解压文件...
echo 👉 请输入密码 (解压):
echo.
ssh -o StrictHostKeyChecking=no ubuntu@152.32.131.4 "cd /home/ubuntu/lessleep && unzip -o lesleep-deploy.zip -d . && cp deploy-package/* . -r"

if errorlevel 1 (
    echo.
    echo ❌ 解压失败！
    pause
    exit /b
)

echo.
echo [4/4] 核心迁移与重启...
echo 👉 请输入密码 (重启):
echo.
ssh -o StrictHostKeyChecking=no ubuntu@152.32.131.4 "cd /home/ubuntu/lessleep && npm install --production && node server/update_db_schema.cjs && node server/import_config_data.cjs && pm2 restart zzzap-backend"

echo.
echo ========================================
echo ✅ 部署完成！
echo ========================================
pause
