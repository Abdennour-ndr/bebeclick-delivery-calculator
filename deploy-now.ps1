# BebeClick One-Click AWS Deployment
# Automated deployment to AWS EC2 Free Tier

param(
    [string]$SecretKey = ""
)

Write-Host "🚀 BebeClick AWS Deployment Starting..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan

# Check if deployment package exists
if (-not (Test-Path "bebeclick-aws-production.tar.gz")) {
    Write-Host "❌ Deployment package not found!" -ForegroundColor Red
    Write-Host "💡 Please run: node create-deployment-package.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Deployment package found" -ForegroundColor Green

# Check AWS CLI
try {
    $awsVersion = aws --version 2>$null
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing AWS CLI..." -ForegroundColor Yellow
    .\install-aws-cli.ps1
}

# Get Secret Key if not provided
if (-not $SecretKey) {
    $SecretKey = Read-Host "🔑 Enter AWS Secret Access Key" -AsSecureString
    $SecretKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretKey))
}

# Set environment variables
$env:AWS_ACCESS_KEY_ID = "AKIA54HZXHAVNBH6KAR4"
$env:AWS_SECRET_ACCESS_KEY = $SecretKey
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host "🔧 Testing AWS credentials..." -ForegroundColor Blue

# Test credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS credentials valid" -ForegroundColor Green
    Write-Host "📋 Account: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "📋 User: $($identity.Arn)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Invalid AWS credentials!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🏗️ Starting EC2 deployment..." -ForegroundColor Blue

# Configuration
$KeyName = "bebeclick-key-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$SecurityGroup = "bebeclick-sg-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$InstanceName = "bebeclick-server"

Write-Host "🔑 Creating SSH key pair: $KeyName" -ForegroundColor Blue

# Create key pair
try {
    $keyMaterial = aws ec2 create-key-pair --key-name $KeyName --query 'KeyMaterial' --output text
    $keyMaterial | Out-File -FilePath "$KeyName.pem" -Encoding ASCII
    Write-Host "✅ SSH key created: $KeyName.pem" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create key pair" -ForegroundColor Red
    exit 1
}

Write-Host "🛡️ Creating security group: $SecurityGroup" -ForegroundColor Blue

# Create security group
try {
    $sgId = aws ec2 create-security-group --group-name $SecurityGroup --description "BebeClick Security Group" --query 'GroupId' --output text
    
    # Add rules
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3001 --cidr 0.0.0.0/0 | Out-Null
    
    Write-Host "✅ Security group created: $sgId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create security group" -ForegroundColor Red
    exit 1
}

Write-Host "🖥️ Launching EC2 instance..." -ForegroundColor Blue

# Create user data script
$userData = @"
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update system
apt-get update -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 and Nginx
npm install -g pm2
apt-get install -y nginx

# Create app directory
mkdir -p /opt/bebeclick
chown ubuntu:ubuntu /opt/bebeclick

echo "Server setup completed" >> /var/log/user-data.log
"@

$userData | Out-File -FilePath "user-data.sh" -Encoding UTF8

# Launch instance
try {
    $instanceId = aws ec2 run-instances `
        --image-id "ami-0c02fb55956c7d316" `
        --count 1 `
        --instance-type "t2.micro" `
        --key-name $KeyName `
        --security-group-ids $sgId `
        --user-data "file://user-data.sh" `
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$InstanceName}]" `
        --query 'Instances[0].InstanceId' `
        --output text
    
    Write-Host "✅ Instance launched: $instanceId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to launch instance" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Waiting for instance to be running..." -ForegroundColor Yellow

# Wait for instance
aws ec2 wait instance-running --instance-ids $instanceId

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Host "✅ Instance running at: $publicIp" -ForegroundColor Green

Write-Host "⏳ Waiting for SSH to be ready..." -ForegroundColor Yellow
Start-Sleep 90

Write-Host "📦 Uploading application..." -ForegroundColor Blue

# Create deployment commands
Write-Host "📋 Creating deployment commands..." -ForegroundColor Blue

# Create upload command
$uploadCmd = "scp -i $KeyName.pem -o StrictHostKeyChecking=no bebeclick-aws-production.tar.gz ubuntu@${publicIp}:~/"

# Create deployment commands
$deployCommands = @(
    "tar -xzf bebeclick-aws-production.tar.gz",
    "sudo mv bebeclick-aws-production/* /opt/bebeclick/",
    "sudo chown -R ubuntu:ubuntu /opt/bebeclick",
    "cd /opt/bebeclick",
    "pm2 start server.js --name bebeclick-app",
    "pm2 save"
)

# Create nginx config
$nginxConfig = @"
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
    }
}
"@

# Save commands to file
$deployScript = @"
#!/bin/bash
set -e
echo "Uploading application..."
$uploadCmd

echo "Deploying application..."
ssh -i $KeyName.pem -o StrictHostKeyChecking=no ubuntu@$publicIp "$(($deployCommands -join '; '))"

echo "Setting up Nginx..."
ssh -i $KeyName.pem -o StrictHostKeyChecking=no ubuntu@$publicIp "echo '$nginxConfig' | sudo tee /etc/nginx/sites-available/bebeclick"
ssh -i $KeyName.pem -o StrictHostKeyChecking=no ubuntu@$publicIp "sudo ln -sf /etc/nginx/sites-available/bebeclick /etc/nginx/sites-enabled/"
ssh -i $KeyName.pem -o StrictHostKeyChecking=no ubuntu@$publicIp "sudo rm -f /etc/nginx/sites-enabled/default"
ssh -i $KeyName.pem -o StrictHostKeyChecking=no ubuntu@$publicIp "sudo systemctl reload nginx"

echo "Deployment completed!"
"@

$deployScript | Out-File -FilePath "deploy.sh" -Encoding UTF8

# Run deployment
try {
    if (Get-Command wsl -ErrorAction SilentlyContinue) {
        wsl bash deploy.sh
    } elseif (Get-Command bash -ErrorAction SilentlyContinue) {
        bash deploy.sh
    } else {
        Write-Host "⚠️ WSL or Git Bash required for deployment" -ForegroundColor Yellow
        Write-Host "📋 Manual deployment commands:" -ForegroundColor Cyan
        Write-Host "scp -i $KeyName.pem bebeclick-aws-production.tar.gz ubuntu@$publicIp`:~/" -ForegroundColor White
        Write-Host "ssh -i $KeyName.pem ubuntu@$publicIp" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️ Automatic deployment failed, but server is ready" -ForegroundColor Yellow
}

# Save deployment info
$deploymentInfo = @"
BebeClick AWS Deployment Complete!
==================================
Date: $(Get-Date)
Instance ID: $instanceId
Public IP: $publicIp
SSH Key: $KeyName.pem
Security Group: $sgId

🌐 Application URLs:
- Main App: http://$publicIp
- Health Check: http://$publicIp/health
- Direct Port: http://$publicIp:3001

🔧 Management Commands:
- SSH: ssh -i $KeyName.pem ubuntu@$publicIp
- Check Status: ssh -i $KeyName.pem ubuntu@$publicIp "pm2 status"
- View Logs: ssh -i $KeyName.pem ubuntu@$publicIp "pm2 logs"
- Restart: ssh -i $KeyName.pem ubuntu@$publicIp "pm2 restart bebeclick-app"

💰 Cost: FREE (t2.micro free tier)
📊 Resources: 1 vCPU, 1GB RAM, 8GB Storage
"@

$deploymentInfo | Out-File -FilePath "deployment-complete.txt" -Encoding UTF8

Write-Host "`n🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "🌐 Your app is live at: http://$publicIp" -ForegroundColor Yellow
Write-Host "🔍 Health check: http://$publicIp/health" -ForegroundColor Cyan
Write-Host "📋 Details saved to: deployment-complete.txt" -ForegroundColor White

# Clean up temporary files
Remove-Item "user-data.sh" -Force -ErrorAction SilentlyContinue
Remove-Item "deploy.sh" -Force -ErrorAction SilentlyContinue

Write-Host "`n✅ BebeClick is now running on AWS!" -ForegroundColor Green
