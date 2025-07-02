# Install AWS CLI on Windows
# BebeClick Deployment Setup

Write-Host "🚀 Installing AWS CLI for BebeClick Deployment..." -ForegroundColor Green

# Check if AWS CLI is already installed
try {
    $awsVersion = aws --version 2>$null
    if ($awsVersion) {
        Write-Host "✅ AWS CLI already installed: $awsVersion" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "📦 AWS CLI not found, installing..." -ForegroundColor Yellow
}

# Download and install AWS CLI
try {
    Write-Host "📥 Downloading AWS CLI..." -ForegroundColor Blue
    
    $downloadUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"
    
    # Download
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    
    Write-Host "🔧 Installing AWS CLI..." -ForegroundColor Blue
    
    # Install silently
    Start-Process msiexec.exe -Wait -ArgumentList "/i $installerPath /quiet"
    
    # Clean up
    Remove-Item $installerPath -Force
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "✅ AWS CLI installed successfully!" -ForegroundColor Green
    
    # Verify installation
    $awsVersion = aws --version 2>$null
    Write-Host "📋 Version: $awsVersion" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Failed to install AWS CLI: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Please install manually from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🎉 AWS CLI installation completed!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: ./aws-auto-deploy.sh" -ForegroundColor White
Write-Host "   2. Enter your AWS Secret Access Key when prompted" -ForegroundColor White
Write-Host "   3. Wait for deployment to complete" -ForegroundColor White
