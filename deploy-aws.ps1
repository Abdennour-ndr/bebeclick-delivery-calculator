# BebeClick AWS Deployment Script
Write-Host "Setting up AWS CLI..." -ForegroundColor Green

# AWS CLI path
$awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

# Check AWS CLI
if (-not (Test-Path $awsPath)) {
    Write-Host "AWS CLI not found!" -ForegroundColor Red
    exit 1
}

Write-Host "AWS CLI found" -ForegroundColor Green

# Get Secret Key
$secretKey = Read-Host "Enter AWS Secret Access Key" -AsSecureString
$secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))

# Configure AWS
Write-Host "Configuring AWS CLI..." -ForegroundColor Blue

& $awsPath configure set aws_access_key_id "AKIA54HZXHAVNBH6KAR4"
& $awsPath configure set aws_secret_access_key $secretKeyPlain
& $awsPath configure set region "us-east-1"
& $awsPath configure set output "json"

Write-Host "AWS CLI configured" -ForegroundColor Green

# Test connection
Write-Host "Testing AWS connection..." -ForegroundColor Blue

try {
    $identity = & $awsPath sts get-caller-identity | ConvertFrom-Json
    Write-Host "AWS connection successful!" -ForegroundColor Green
    Write-Host "Account: $($identity.Account)" -ForegroundColor Cyan
    
    # Deploy
    Write-Host "Starting deployment..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "MMddHHmm"
    $keyName = "bebeclick-$timestamp"
    $sgName = "bebeclick-sg-$timestamp"
    
    Write-Host "Creating SSH key..." -ForegroundColor Blue
    $keyData = & $awsPath ec2 create-key-pair --key-name $keyName --query KeyMaterial --output text
    $keyData | Out-File -FilePath "$keyName.pem" -Encoding ASCII
    Write-Host "SSH key created: $keyName.pem" -ForegroundColor Green
    
    Write-Host "Creating security group..." -ForegroundColor Blue
    $sgId = & $awsPath ec2 create-security-group --group-name $sgName --description "BebeClick SG" --query GroupId --output text
    
    & $awsPath ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 | Out-Null
    & $awsPath ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 | Out-Null
    & $awsPath ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3001 --cidr 0.0.0.0/0 | Out-Null
    
    Write-Host "Security group created: $sgId" -ForegroundColor Green
    
    Write-Host "Launching EC2 instance..." -ForegroundColor Blue
    
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
    
    $instanceId = & $awsPath ec2 run-instances --image-id ami-0c02fb55956c7d316 --count 1 --instance-type t2.micro --key-name $keyName --security-group-ids $sgId --user-data file://userdata.txt --query "Instances[0].InstanceId" --output text
    
    Write-Host "Instance launched: $instanceId" -ForegroundColor Green
    Write-Host "Waiting for instance..." -ForegroundColor Yellow
    
    & $awsPath ec2 wait instance-running --instance-ids $instanceId
    
    $publicIp = & $awsPath ec2 describe-instances --instance-ids $instanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text
    
    Write-Host ""
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    Write-Host "Server IP: $publicIp" -ForegroundColor Yellow
    Write-Host "SSH Key: $keyName.pem" -ForegroundColor Cyan
    Write-Host "Instance ID: $instanceId" -ForegroundColor White
    
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
4. Deploy: cd bebeclick-aws-production && pm2 start server.js --name bebeclick

URLs (after deployment):
- App: http://$publicIp
- Health: http://$publicIp/health

Management:
- SSH: ssh -i $keyName.pem ubuntu@$publicIp
- Status: ssh -i $keyName.pem ubuntu@$publicIp "pm2 status"
- Logs: ssh -i $keyName.pem ubuntu@$publicIp "pm2 logs"
"@
    
    $info | Out-File -FilePath "deployment-info.txt" -Encoding UTF8
    
    Write-Host ""
    Write-Host "Details saved to: deployment-info.txt" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Server ready! Upload your app:" -ForegroundColor Yellow
    Write-Host "scp -i $keyName.pem bebeclick-aws-production.zip ubuntu@$publicIp`:~/" -ForegroundColor White
    
    Remove-Item "userdata.txt" -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "AWS connection failed!" -ForegroundColor Red
    Write-Host "Check your Secret Access Key" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
