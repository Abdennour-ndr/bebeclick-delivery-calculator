# BebeClick Simple AWS Deployment
# One-click deployment to AWS EC2

Write-Host "🚀 BebeClick AWS Deployment" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Cyan

# Check deployment package
if (-not (Test-Path "bebeclick-aws-production.tar.gz")) {
    Write-Host "❌ Deployment package not found!" -ForegroundColor Red
    Write-Host "💡 Creating deployment package..." -ForegroundColor Yellow
    
    # Create simple package
    if (Test-Path "aws-deployment") {
        Compress-Archive -Path "aws-deployment\*" -DestinationPath "bebeclick-aws-production.zip" -Force
        Write-Host "✅ Package created: bebeclick-aws-production.zip" -ForegroundColor Green
    } else {
        Write-Host "❌ aws-deployment folder not found!" -ForegroundColor Red
        exit 1
    }
}

# Get AWS credentials
$AccessKey = "AKIA54HZXHAVNBH6KAR4"
$SecretKey = Read-Host "🔑 Enter AWS Secret Access Key" -AsSecureString
$SecretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretKey))

# Set environment variables
$env:AWS_ACCESS_KEY_ID = $AccessKey
$env:AWS_SECRET_ACCESS_KEY = $SecretKeyPlain
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host "🔧 Testing AWS credentials..." -ForegroundColor Blue

# Test AWS CLI
try {
    $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    Write-Host "✅ AWS credentials valid" -ForegroundColor Green
    Write-Host "📋 Account: $($identity.Account)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ AWS CLI not found or invalid credentials!" -ForegroundColor Red
    Write-Host "💡 Installing AWS CLI..." -ForegroundColor Yellow
    
    # Download and install AWS CLI
    $downloadUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
        Start-Process msiexec.exe -Wait -ArgumentList "/i $installerPath /quiet"
        Remove-Item $installerPath -Force
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ AWS CLI installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install AWS CLI" -ForegroundColor Red
        Write-Host "💡 Please install manually: https://aws.amazon.com/cli/" -ForegroundColor Yellow
        exit 1
    }
}

# Generate unique names
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$keyName = "bebeclick-key-$timestamp"
$sgName = "bebeclick-sg-$timestamp"

Write-Host "🔑 Creating SSH key pair..." -ForegroundColor Blue

# Create key pair
try {
    $keyMaterial = aws ec2 create-key-pair --key-name $keyName --query 'KeyMaterial' --output text 2>$null
    if ($keyMaterial) {
        $keyMaterial | Out-File -FilePath "$keyName.pem" -Encoding ASCII
        Write-Host "✅ SSH key created: $keyName.pem" -ForegroundColor Green
    } else {
        throw "Failed to create key pair"
    }
} catch {
    Write-Host "❌ Failed to create SSH key" -ForegroundColor Red
    Write-Host "💡 Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

Write-Host "🛡️ Creating security group..." -ForegroundColor Blue

# Create security group
try {
    $sgId = aws ec2 create-security-group --group-name $sgName --description "BebeClick Security Group" --query 'GroupId' --output text 2>$null
    
    if ($sgId) {
        # Add rules
        aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 2>$null
        aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 2>$null
        aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3001 --cidr 0.0.0.0/0 2>$null
        
        Write-Host "✅ Security group created: $sgId" -ForegroundColor Green
    } else {
        throw "Failed to create security group"
    }
} catch {
    Write-Host "❌ Failed to create security group" -ForegroundColor Red
    Write-Host "💡 Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

Write-Host "🖥️ Launching EC2 instance..." -ForegroundColor Blue

# Create user data
$userData = @"
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
apt-get update -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs nginx
npm install -g pm2
mkdir -p /opt/bebeclick
chown ubuntu:ubuntu /opt/bebeclick
echo "Setup completed" >> /var/log/user-data.log
"@

$userData | Out-File -FilePath "user-data.sh" -Encoding UTF8

# Launch instance
try {
    $instanceId = aws ec2 run-instances `
        --image-id "ami-0c02fb55956c7d316" `
        --count 1 `
        --instance-type "t2.micro" `
        --key-name $keyName `
        --security-group-ids $sgId `
        --user-data "file://user-data.sh" `
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=bebeclick-server}]" `
        --query 'Instances[0].InstanceId' `
        --output text 2>$null
    
    if ($instanceId) {
        Write-Host "✅ Instance launched: $instanceId" -ForegroundColor Green
    } else {
        throw "Failed to launch instance"
    }
} catch {
    Write-Host "❌ Failed to launch instance" -ForegroundColor Red
    Write-Host "💡 Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

Write-Host "⏳ Waiting for instance to start..." -ForegroundColor Yellow

# Wait for instance
aws ec2 wait instance-running --instance-ids $instanceId

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Host "✅ Instance running at: $publicIp" -ForegroundColor Green
Write-Host "⏳ Waiting for SSH (90 seconds)..." -ForegroundColor Yellow

Start-Sleep 90

# Create deployment info
$deploymentInfo = @"
🎉 BebeClick AWS Deployment Complete!
====================================
Date: $(Get-Date)
Instance ID: $instanceId
Public IP: $publicIp
SSH Key: $keyName.pem
Security Group: $sgId

🌐 URLs (will be ready after manual deployment):
- Main App: http://$publicIp
- Health Check: http://$publicIp/health
- Direct Port: http://$publicIp:3001

🔧 Next Steps:
1. Upload app: scp -i $keyName.pem bebeclick-aws-production.zip ubuntu@$publicIp`:~/
2. Connect: ssh -i $keyName.pem ubuntu@$publicIp
3. Extract: unzip bebeclick-aws-production.zip
4. Deploy: cd bebeclick-aws-production && pm2 start server.js --name bebeclick

💰 Cost: FREE (t2.micro free tier)
📊 Resources: 1 vCPU, 1GB RAM, 8GB Storage

🔧 Management Commands:
- SSH: ssh -i $keyName.pem ubuntu@$publicIp
- Status: ssh -i $keyName.pem ubuntu@$publicIp "pm2 status"
- Logs: ssh -i $keyName.pem ubuntu@$publicIp "pm2 logs"
- Restart: ssh -i $keyName.pem ubuntu@$publicIp "pm2 restart bebeclick"
"@

$deploymentInfo | Out-File -FilePath "deployment-info.txt" -Encoding UTF8

Write-Host "`n🎉 AWS INSTANCE CREATED!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Cyan
Write-Host "🌐 Server IP: $publicIp" -ForegroundColor Yellow
Write-Host "🔑 SSH Key: $keyName.pem" -ForegroundColor Cyan
Write-Host "📋 Full details: deployment-info.txt" -ForegroundColor White

Write-Host "`n📦 Manual Deployment Steps:" -ForegroundColor Blue
Write-Host "1. scp -i $keyName.pem bebeclick-aws-production.zip ubuntu@$publicIp`:~/" -ForegroundColor White
Write-Host "2. ssh -i $keyName.pem ubuntu@$publicIp" -ForegroundColor White
Write-Host "3. unzip bebeclick-aws-production.zip" -ForegroundColor White
Write-Host "4. cd bebeclick-aws-production" -ForegroundColor White
Write-Host "5. pm2 start server.js --name bebeclick" -ForegroundColor White

# Clean up
Remove-Item "user-data.sh" -Force -ErrorAction SilentlyContinue

Write-Host "`n✅ Server ready for deployment!" -ForegroundColor Green
