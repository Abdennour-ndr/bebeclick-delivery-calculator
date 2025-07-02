# Setup AWS CLI and Deploy
Write-Host "🔧 Setting up AWS CLI..." -ForegroundColor Green

# AWS CLI path
$awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

# Check if AWS CLI exists
if (-not (Test-Path $awsPath)) {
    Write-Host "❌ AWS CLI not found at $awsPath" -ForegroundColor Red
    Write-Host "💡 Please install AWS CLI manually" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ AWS CLI found" -ForegroundColor Green

# Get Secret Access Key
$secretKey = Read-Host "🔑 Enter AWS Secret Access Key" -AsSecureString
$secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))

# Configure AWS CLI
Write-Host "🔧 Configuring AWS CLI..." -ForegroundColor Blue

& $awsPath configure set aws_access_key_id "AKIA54HZXHAVNBH6KAR4"
& $awsPath configure set aws_secret_access_key $secretKeyPlain
& $awsPath configure set region "us-east-1"
& $awsPath configure set output "json"

Write-Host "✅ AWS CLI configured" -ForegroundColor Green

# Test connection
Write-Host "🧪 Testing AWS connection..." -ForegroundColor Blue

try {
    $identity = & $awsPath sts get-caller-identity | ConvertFrom-Json
    Write-Host "✅ AWS connection successful!" -ForegroundColor Green
    Write-Host "📋 Account: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "📋 User: $($identity.Arn)" -ForegroundColor Cyan
    
    # Now deploy
    Write-Host ""
    Write-Host "🚀 Starting deployment..." -ForegroundColor Yellow
    
    # Generate unique names
    $timestamp = Get-Date -Format "MMddHHmm"
    $keyName = "bebeclick-$timestamp"
    $sgName = "bebeclick-sg-$timestamp"
    
    Write-Host "🔑 Creating SSH key pair..." -ForegroundColor Blue
    $keyData = & $awsPath ec2 create-key-pair --key-name $keyName --query KeyMaterial --output text
    $keyData | Out-File -FilePath "$keyName.pem" -Encoding ASCII
    Write-Host "✅ SSH key created: $keyName.pem" -ForegroundColor Green
    
    Write-Host "🛡️ Creating security group..." -ForegroundColor Blue
    $sgId = & $awsPath ec2 create-security-group --group-name $sgName --description "BebeClick Security Group" --query GroupId --output text
    
    # Add security rules
    & $awsPath ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 | Out-Null
    & $awsPath ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
    & $awsPath ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3001 --cidr 0.0.0.0/0 | Out-Null
    
    Write-Host "✅ Security group created: $sgId" -ForegroundColor Green
    
    Write-Host "🖥️ Launching EC2 instance..." -ForegroundColor Blue
    
    # Create user data
    $userData = @"
#!/bin/bash
apt-get update -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs nginx
npm install -g pm2
mkdir -p /opt/bebeclick
chown ubuntu:ubuntu /opt/bebeclick
"@
    
    $userData | Out-File -FilePath "userdata.txt" -Encoding UTF8
    
    # Launch instance
    $instanceId = & $awsPath ec2 run-instances --image-id ami-0c02fb55956c7d316 --count 1 --instance-type t2.micro --key-name $keyName --security-group-ids $sgId --user-data file://userdata.txt --query "Instances[0].InstanceId" --output text
    
    Write-Host "✅ Instance launched: $instanceId" -ForegroundColor Green
    Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Yellow
    
    # Wait for instance
    & $awsPath ec2 wait instance-running --instance-ids $instanceId
    
    # Get public IP
    $publicIp = & $awsPath ec2 describe-instances --instance-ids $instanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text
    
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host "🌐 Server IP: $publicIp" -ForegroundColor Yellow
    Write-Host "🔑 SSH Key: $keyName.pem" -ForegroundColor Cyan
    Write-Host "🆔 Instance ID: $instanceId" -ForegroundColor White
    
    # Create deployment info
    $deploymentInfo = @"
🎉 BebeClick AWS Deployment Complete!
====================================
Date: $(Get-Date)
Instance ID: $instanceId
Public IP: $publicIp
SSH Key: $keyName.pem
Security Group: $sgId

📦 Next Steps - Upload and Deploy App:
1. Upload: scp -i $keyName.pem bebeclick-aws-production.zip ubuntu@$publicIp`:~/
2. Connect: ssh -i $keyName.pem ubuntu@$publicIp
3. Extract: unzip bebeclick-aws-production.zip
4. Deploy: cd bebeclick-aws-production && pm2 start server.js --name bebeclick

🌐 URLs (after app deployment):
- Main App: http://$publicIp
- Health Check: http://$publicIp/health
- Direct Port: http://$publicIp:3001

🔧 Management Commands:
- SSH: ssh -i $keyName.pem ubuntu@$publicIp
- Status: ssh -i $keyName.pem ubuntu@$publicIp "pm2 status"
- Logs: ssh -i $keyName.pem ubuntu@$publicIp "pm2 logs"
- Restart: ssh -i $keyName.pem ubuntu@$publicIp "pm2 restart bebeclick"

💰 Cost: FREE (t2.micro free tier)
📊 Resources: 1 vCPU, 1GB RAM, 8GB Storage
"@
    
    $deploymentInfo | Out-File -FilePath "deployment-success.txt" -Encoding UTF8
    
    Write-Host ""
    Write-Host "📋 Full deployment details saved to: deployment-success.txt" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🚀 Server is ready! Now upload your app:" -ForegroundColor Yellow
    Write-Host "scp -i $keyName.pem bebeclick-aws-production.zip ubuntu@$publicIp`:~/" -ForegroundColor White
    
    # Clean up
    Remove-Item "userdata.txt" -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ AWS connection failed!" -ForegroundColor Red
    Write-Host "💡 Please check your Secret Access Key" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
