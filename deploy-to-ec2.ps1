# BebeClick Delivery Calculator - AWS EC2 Deployment Script (PowerShell)
Write-Host "🚀 Starting deployment to AWS EC2..." -ForegroundColor Green

# Variables
$APP_NAME = "bebeclick-delivery-calculator"
$EC2_USER = "ubuntu"
$EC2_HOST = "ec2-3-83-245-139.compute-1.amazonaws.com"
$REMOTE_DIR = "/home/ubuntu/bebeclick-delivery-calculator"
$KEY_PATH = "$env:USERPROFILE\.ssh\bebeclick-key.pem"

try {
    Write-Host "📦 Building application..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed!"
    }
    
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
    
    Write-Host "📤 Creating deployment package..." -ForegroundColor Yellow
    
    # Create temporary directory for deployment files
    $tempDir = "temp-deploy"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir
    
    # Copy necessary files
    Copy-Item "dist" -Destination "$tempDir\dist" -Recurse
    Copy-Item "production-server.js" -Destination "$tempDir\server.js"
    Copy-Item "server-package.json" -Destination "$tempDir\package.json"
    
    # Create tar.gz file (requires 7-Zip or similar)
    Write-Host "Creating archive..." -ForegroundColor Yellow
    Compress-Archive -Path "$tempDir\*" -DestinationPath "deployment.zip" -Force
    
    Write-Host "📤 Uploading to EC2..." -ForegroundColor Yellow
    
    # Upload using SCP (requires OpenSSH or PuTTY)
    scp -i $KEY_PATH deployment.zip "${EC2_USER}@${EC2_HOST}:/tmp/"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Upload failed!"
    }
    
    Write-Host "🔧 Deploying on EC2..." -ForegroundColor Yellow
    
    # Deploy on EC2 using SSH
    $deployScript = @"
# Stop existing application
sudo pkill -f 'node.*server.js' || true

# Create app directory
sudo mkdir -p /home/ubuntu/bebeclick-delivery-calculator
cd /home/ubuntu/bebeclick-delivery-calculator

# Remove old files
sudo rm -rf dist/ server.js package.json node_modules/

# Extract new files
sudo unzip -o /tmp/deployment.zip

# Install dependencies
sudo npm install --production

# Set permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/bebeclick-delivery-calculator

# Install PM2 if not exists
which pm2 || sudo npm install -g pm2

# Start application with PM2
pm2 stop bebeclick-delivery-calculator || true
pm2 delete bebeclick-delivery-calculator || true
pm2 start server.js --name bebeclick-delivery-calculator
pm2 save
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

# Clean up
rm /tmp/deployment.zip

echo '✅ Deployment completed!'
echo '🌐 Application is running on port 3000'
"@
    
    # Execute deployment script on EC2
    $deployScript | ssh -i $KEY_PATH "${EC2_USER}@${EC2_HOST}" 'bash -s'
    
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed!"
    }
    
    # Clean up local files
    Remove-Item "deployment.zip" -Force
    Remove-Item $tempDir -Recurse -Force
    
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your application should be available at: http://$EC2_HOST`:3000" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
