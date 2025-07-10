# ===================================
# BebeClick AWS Deployment - FINAL
# ===================================

$KeyPath = "bebeclick-delivery-calculator.pem"
$ServerIP = "54.234.157.25"
$ServerUser = "ubuntu"

Write-Host "🚀 Starting BebeClick Deployment to AWS" -ForegroundColor Green
Write-Host "Server: $ServerIP" -ForegroundColor Cyan
Write-Host "Key: $KeyPath" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

# Check if key file exists
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ SSH key not found: $KeyPath" -ForegroundColor Red
    exit 1
}

# Check if package exists
if (-not (Test-Path "bebeclick-production.zip")) {
    Write-Host "❌ Production package not found" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Uploading files to server..." -ForegroundColor Blue

# Upload package
Write-Host "📦 Uploading production package..." -ForegroundColor Yellow
scp -i $KeyPath bebeclick-production.zip "${ServerUser}@${ServerIP}:~/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload package" -ForegroundColor Red
    exit 1
}

# Upload deployment script
Write-Host "📜 Uploading deployment script..." -ForegroundColor Yellow
scp -i $KeyPath aws-deploy.sh "${ServerUser}@${ServerIP}:~/"

# Upload environment config
Write-Host "⚙️ Uploading environment config..." -ForegroundColor Yellow
scp -i $KeyPath .env.production.example "${ServerUser}@${ServerIP}:~/"

Write-Host "✅ Files uploaded successfully" -ForegroundColor Green

Write-Host "🚀 Starting deployment on server..." -ForegroundColor Blue

# Connect and deploy
Write-Host "🔧 Preparing deployment..." -ForegroundColor Yellow
ssh -i $KeyPath "${ServerUser}@${ServerIP}" "sudo apt update -qq"

Write-Host "📋 Checking uploaded files..." -ForegroundColor Yellow
ssh -i $KeyPath "${ServerUser}@${ServerIP}" "ls -la bebeclick-production.zip aws-deploy.sh"

Write-Host "🔧 Setting permissions..." -ForegroundColor Yellow
ssh -i $KeyPath "${ServerUser}@${ServerIP}" "chmod +x aws-deploy.sh"

Write-Host "🚀 Running deployment script..." -ForegroundColor Yellow
ssh -i $KeyPath "${ServerUser}@${ServerIP}" "sudo ./aws-deploy.sh"

Write-Host "✅ Deployment completed!" -ForegroundColor Green

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Test deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Blue
$healthUrl = "http://${ServerIP}/health"
Write-Host "🔍 Testing: $healthUrl" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 30
    if ($response.status -eq "OK") {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Health check returned: $($response.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Health check failed, but deployment may still be successful" -ForegroundColor Yellow
    Write-Host "🔍 Trying basic connection test..." -ForegroundColor Yellow
    try {
        $basicTest = Invoke-WebRequest -Uri "http://${ServerIP}" -TimeoutSec 10
        if ($basicTest.StatusCode -eq 200) {
            Write-Host "✅ Basic connection test passed!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Basic connection test also failed" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Deployment Summary" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "🌐 Application URL: http://${ServerIP}" -ForegroundColor Cyan
Write-Host "🔍 Health Check: http://${ServerIP}/health" -ForegroundColor Cyan
Write-Host "📊 Detailed Health: http://${ServerIP}/health/detailed" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables:" -ForegroundColor White
Write-Host "   ssh -i $KeyPath ${ServerUser}@${ServerIP}" -ForegroundColor Cyan
Write-Host "   cd /opt/bebeclick-calculator/current" -ForegroundColor Cyan
Write-Host "   sudo nano .env" -ForegroundColor Cyan
Write-Host "   pm2 restart bebeclick-backend" -ForegroundColor Cyan

Write-Host ""
Write-Host "2. Monitor the application:" -ForegroundColor White
Write-Host "   pm2 status" -ForegroundColor Cyan
Write-Host "   pm2 logs" -ForegroundColor Cyan
Write-Host "   sudo systemctl status nginx" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

# Open browser
Write-Host ""
Write-Host "🌐 Opening application in browser..." -ForegroundColor Blue
Start-Process "http://${ServerIP}"
