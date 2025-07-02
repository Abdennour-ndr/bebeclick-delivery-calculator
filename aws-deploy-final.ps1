# BebeClick AWS Deployment - Final Working Version
param(
    [string]$SecretKey = ""
)

Write-Host "🚀 BebeClick AWS Deployment" -ForegroundColor Green

# Check if package exists
if (-not (Test-Path "bebeclick-aws-production.tar.gz")) {
    if (Test-Path "aws-deployment") {
        Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
        Compress-Archive -Path "aws-deployment\*" -DestinationPath "bebeclick-aws-production.zip" -Force
        Write-Host "✅ Package created" -ForegroundColor Green
    } else {
        Write-Host "❌ No deployment files found!" -ForegroundColor Red
        exit 1
    }
}

# Get credentials
if (-not $SecretKey) {
    $SecretKey = Read-Host "Enter AWS Secret Access Key"
}

# Set environment
$env:AWS_ACCESS_KEY_ID = "AKIA54HZXHAVNBH6KAR4"
$env:AWS_SECRET_ACCESS_KEY = $SecretKey
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host "🔧 Testing AWS connection..." -ForegroundColor Blue

# Test AWS
try {
    $result = aws sts get-caller-identity 2>$null
    if ($result) {
        Write-Host "✅ AWS connection successful" -ForegroundColor Green
    } else {
        throw "AWS CLI failed"
    }
} catch {
    Write-Host "❌ AWS CLI not working. Installing..." -ForegroundColor Yellow
    
    # Simple AWS CLI install
    $url = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $path = "$env:TEMP\aws.msi"
    
    Invoke-WebRequest -Uri $url -OutFile $path
    Start-Process msiexec.exe -Wait -ArgumentList "/i $path /quiet"
    Remove-Item $path
    
    Write-Host "✅ AWS CLI installed. Please restart PowerShell and run again." -ForegroundColor Green
    exit 0
}

# Generate names
$timestamp = Get-Date -Format "MMddHHmm"
$keyName = "bebeclick-$timestamp"
$sgName = "bebeclick-sg-$timestamp"

Write-Host "🔑 Creating SSH key..." -ForegroundColor Blue

# Create key
try {
    $keyData = aws ec2 create-key-pair --key-name $keyName --query KeyMaterial --output text
    $keyData | Out-File -FilePath "$keyName.pem" -Encoding ASCII
    Write-Host "✅ Key created: $keyName.pem" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create key" -ForegroundColor Red
    exit 1
}

Write-Host "🛡️ Creating security group..." -ForegroundColor Blue

# Create security group
try {
    $sgId = aws ec2 create-security-group --group-name $sgName --description "BebeClick SG" --query GroupId --output text
    
    # Add rules
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3001 --cidr 0.0.0.0/0 | Out-Null
    
    Write-Host "✅ Security group created: $sgId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create security group" -ForegroundColor Red
    exit 1
}

Write-Host "🖥️ Launching instance..." -ForegroundColor Blue

# User data
$userData = "#!/bin/bash`napt-get update -y`ncurl -fsSL https://deb.nodesource.com/setup_18.x | bash -`napt-get install -y nodejs nginx`nnpm install -g pm2`nmkdir -p /opt/bebeclick`nchown ubuntu:ubuntu /opt/bebeclick"
$userData | Out-File -FilePath "userdata.txt" -Encoding UTF8

# Launch instance
try {
    $instanceId = aws ec2 run-instances --image-id ami-0c02fb55956c7d316 --count 1 --instance-type t2.micro --key-name $keyName --security-group-ids $sgId --user-data file://userdata.txt --query "Instances[0].InstanceId" --output text

    Write-Host "✅ Instance launched: $instanceId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to launch instance" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Waiting for instance..." -ForegroundColor Yellow

# Wait for running
aws ec2 wait instance-running --instance-ids $instanceId

# Get IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text

Write-Host "✅ Instance ready: $publicIp" -ForegroundColor Green
Write-Host "⏳ Waiting 90 seconds for SSH..." -ForegroundColor Yellow

Start-Sleep 90

# Create info file
$info = @"
BebeClick AWS Deployment Complete!
==================================
Instance ID: $instanceId
Public IP: $publicIp
SSH Key: $keyName.pem
Security Group: $sgId

Next Steps:
1. Upload: scp -i $keyName.pem bebeclick-aws-production.zip ubuntu@$publicIp`:~/
2. Connect: ssh -i $keyName.pem ubuntu@$publicIp
3. Extract: unzip bebeclick-aws-production.zip
4. Run: cd bebeclick-aws-production && pm2 start server.js --name bebeclick

URLs (after deployment):
- App: http://$publicIp
- Health: http://$publicIp/health
"@

$info | Out-File -FilePath "aws-info.txt" -Encoding UTF8

Write-Host "`n🎉 AWS INSTANCE READY!" -ForegroundColor Green
Write-Host "IP: $publicIp" -ForegroundColor Yellow
Write-Host "Key: $keyName.pem" -ForegroundColor Cyan
Write-Host "Info: aws-info.txt" -ForegroundColor White

# Clean up
Remove-Item "userdata.txt" -ErrorAction SilentlyContinue

Write-Host "`n📋 Manual steps saved to aws-info.txt" -ForegroundColor Blue
