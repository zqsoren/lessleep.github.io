@echo off
echo ========================================
echo 正在打包部署文件...
echo ========================================

REM 创建部署目录
if exist deploy-package rmdir /s /q deploy-package
mkdir deploy-package

echo [1/6] 复制前端源码...
xcopy /E /I /Y components deploy-package\components
xcopy /E /I /Y pages deploy-package\pages
xcopy /E /I /Y contexts deploy-package\contexts
xcopy /E /I /Y public deploy-package\public
copy /Y App.tsx deploy-package\
copy /Y index.tsx deploy-package\
copy /Y index.html deploy-package\
copy /Y types.ts deploy-package\

echo [2/6] 复制后端源码...
mkdir deploy-package\server
copy /Y server\server.js deploy-package\server\
copy /Y server\set-admin.js deploy-package\server\
mkdir deploy-package\server\uploads
echo. > deploy-package\server\uploads\.gitkeep

echo [3/6] 复制配置文件...
copy /Y package.json deploy-package\
copy /Y package-lock.json deploy-package\
copy /Y tsconfig.json deploy-package\
copy /Y vite.config.ts deploy-package\
copy /Y .gitignore deploy-package\

echo [4/6] 创建环境变量模板...
(
echo # 生产环境配置
echo PORT=3001
echo JWT_SECRET=请修改为强密码
echo GEMINI_API_KEY=你的Gemini-API密钥
echo DATABASE_PATH=./server/database.db
) > deploy-package\.env.example

echo [5/6] 复制文档...
copy /Y README.md deploy-package\ 2>nul
copy /Y DEPLOYMENT.md deploy-package\ 2>nul

echo [6/6] 创建压缩包...
powershell Compress-Archive -Path deploy-package\* -DestinationPath lesleep-deploy.zip -Force

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo.
echo 生成的文件：
echo   - lesleep-deploy.zip (压缩包)
echo   - deploy-package\ (文件夹)
echo.
echo 下一步：
echo 1. 将 lesleep-deploy.zip 上传到服务器
echo 2. 在服务器上解压
echo 3. 复制 .env.example 为 .env 并修改配置
echo 4. 运行 npm install
echo 5. 运行 npm run build
echo 6. 启动服务
echo.
pause
