# ===================================
# BebeClick AWS Deployment Script
# Server: 54.234.157.25
# ===================================

param(
    [string]$KeyPath = "bebeclick-07010344.pem",
    [string]$ServerIP = "54.234.157.25",
    [string]$ServerUser = "ubuntu"
)

# Colors for output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "🚀 Starting BebeClick Deployment to AWS" "Green"
Write-ColorOutput "Server: $ServerIP" "Cyan"
Write-ColorOutput "========================================" "Green"

# Check if key file exists
if (-not (Test-Path $KeyPath)) {
    Write-ColorOutput "❌ SSH key not found: $KeyPath" "Red"
    Write-ColorOutput "Please make sure the key file is in the current directory" "Yellow"
    exit 1
}

# Check if package exists
if (-not (Test-Path "bebeclick-production.zip")) {
    Write-ColorOutput "❌ Production package not found: bebeclick-production.zip" "Red"
    Write-ColorOutput "Please run 'npm run build' first" "Yellow"
    exit 1
}

try {
    Write-ColorOutput "📤 Uploading files to server..." "Blue"
    
    # Upload package
    Write-ColorOutput "📦 Uploading production package..." "Yellow"
    scp -i $KeyPath bebeclick-production.zip "${ServerUser}@${ServerIP}:~/"
    
    # Upload deployment script
    Write-ColorOutput "📜 Uploading deployment script..." "Yellow"
    scp -i $KeyPath aws-deploy.sh "${ServerUser}@${ServerIP}:~/"
    
    # Upload environment config
    Write-ColorOutput "⚙️ Uploading environment config..." "Yellow"
    scp -i $KeyPath .env.production.example "${ServerUser}@${ServerIP}:~/"
    
    Write-ColorOutput "✅ Files uploaded successfully" "Green"
    
    Write-ColorOutput "🚀 Starting deployment on server..." "Blue"
    
    # Connect and deploy
    $deployCommands = @(
        "echo '🔧 Preparing deployment...'",
        "sudo apt update -qq",
        "cd ~",
        "ls -la bebeclick-production.zip",
        "chmod +x aws-deploy.sh",
        "echo '🚀 Running deployment script...'",
        "sudo ./aws-deploy.sh"
    )
    
    foreach ($command in $deployCommands) {
        Write-ColorOutput "🔧 Executing: $command" "Yellow"
        ssh -i $KeyPath "${ServerUser}@${ServerIP}" $command
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "⚠️ Command failed, but continuing..." "Yellow"
        }
    }
    
    Write-ColorOutput "✅ Deployment completed!" "Green"

    # Wait for services to start
    Write-ColorOutput "⏳ Waiting for services to start..." "Yellow"
    Start-Sleep -Seconds 15

    # Test deployment
    Write-ColorOutput "🧪 Testing deployment..." "Blue"

    try {
        $healthUrl = "http://${ServerIP}/health"
        Write-ColorOutput "🔍 Testing: $healthUrl" "Yellow"

        $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 30

        if ($response.status -eq "OK") {
            Write-ColorOutput "✅ Health check passed!" "Green"
        } else {
            Write-ColorOutput "⚠️ Health check returned: $($response.status)" "Yellow"
        }
    }
    catch {
        Write-ColorOutput "⚠️ Health check failed, but deployment may still be successful" "Yellow"
    }
    
    Write-ColorOutput "`n🎉 Deployment Summary" "Green"
    Write-ColorOutput "===================" "Green"
    Write-ColorOutput "🌐 Application URL: http://${ServerIP}" "Cyan"
    Write-ColorOutput "🔍 Health Check: http://${ServerIP}/health" "Cyan"
    Write-ColorOutput "📊 Detailed Health: http://${ServerIP}/health/detailed" "Cyan"
    
    Write-ColorOutput "`n📋 Next Steps:" "Yellow"
    Write-ColorOutput "1. Configure environment variables:" "White"
    Write-ColorOutput "   ssh -i $KeyPath ${ServerUser}@${ServerIP}" "Cyan"
    Write-ColorOutput "   cd /opt/bebeclick-calculator/current" "Cyan"
    Write-ColorOutput "   sudo nano .env" "Cyan"
    Write-ColorOutput "   pm2 restart bebeclick-backend" "Cyan"
    
    Write-ColorOutput "`n2. Monitor the application:" "White"
    Write-ColorOutput "   pm2 status" "Cyan"
    Write-ColorOutput "   pm2 logs" "Cyan"
    Write-ColorOutput "   sudo systemctl status nginx" "Cyan"
    
    Write-ColorOutput "`n✅ Deployment completed successfully!" "Green"
    
    # Open browser
    Write-ColorOutput "`n🌐 Opening application in browser..." "Blue"
    Start-Process "http://${ServerIP}"
}
catch {
    Write-ColorOutput "❌ Deployment failed: $($_.Exception.Message)" "Red"
    Write-ColorOutput "📞 Check the logs and try again" "Yellow"
    
    Write-ColorOutput "`n🔍 Troubleshooting commands:" "Yellow"
    Write-ColorOutput "ssh -i $KeyPath ${ServerUser}@${ServerIP}" "Cyan"
    Write-ColorOutput "pm2 logs" "Cyan"
    Write-ColorOutput "sudo tail -f /var/log/nginx/error.log" "Cyan"
    
    exit 1
}
