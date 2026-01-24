$ServerIP = "152.32.131.4"
$User = "ubuntu"
# 自动切换到脚本所在目录，确保能找到 zip 文件
Set-Location $PSScriptRoot
$RemotePath = "/home/ubuntu/lessleep"
$ZipFile = "lesleep-deploy.zip"

Write-Host "========================================"
Write-Host "🚀 Starting Deployment to $User@$ServerIP"
Write-Host "========================================"

# 1. Upload Zip
Write-Host "[1/3] Uploading $ZipFile..."
Write-Host "👉 If prompted, type password (2002zhangqing) and press Enter."
& scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $ZipFile "$User@${ServerIP}:$RemotePath/"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Upload failed! Please check your password and try again."
    exit
}

# 2. Extract and Setup
Write-Host "[2/3] Extracting files on server..."
$UnzipCmd = "cd $RemotePath && unzip -o $ZipFile -d . && cp deploy-package/* . -r"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $User@$ServerIP $UnzipCmd

# 3. Migration
Write-Host "[3/3] Running Database Migration & Config Sync..."
$MigrateCmd = "cd $RemotePath && npm install --production && node server/update_db_schema.cjs && node server/import_config_data.cjs && pm2 restart zzzap-backend"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $User@$ServerIP $MigrateCmd

Write-Host "========================================"
Write-Host "✅ Deployment Complete!"
Write-Host "========================================"
Write-Host "Please verify the site is running."
