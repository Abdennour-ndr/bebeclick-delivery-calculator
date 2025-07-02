# BebeClick AWS Deployment - Simple Version

Write-Host "BebeClick AWS Deployment" -ForegroundColor Green

# Get Secret Key
$SecretKey = Read-Host "Enter AWS Secret Access Key"

# Set AWS credentials
$env:AWS_ACCESS_KEY_ID = "AKIA54HZXHAVNBH6KAR4"
$env:AWS_SECRET_ACCESS_KEY = $SecretKey
$env:AWS_DEFAULT_REGION = "us-east-1"

# Test AWS
Write-Host "Testing AWS connection..." -ForegroundColor Blue
try {
    $result = aws sts get-caller-identity
    Write-Host "AWS connection successful" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Generate unique names
$timestamp = Get-Date -Format "MMddHHmm"
$keyName = "bebeclick-$timestamp"
$sgName = "bebeclick-sg-$timestamp"

Write-Host "Creating SSH key pair..." -ForegroundColor Blue
$keyData = aws ec2 create-key-pair --key-name $keyName --query KeyMaterial --output text
$keyData | Out-File -FilePath "$keyName.pem" -Encoding ASCII

Write-Host "Creating security group..." -ForegroundColor Blue
$sgId = aws ec2 create-security-group --group-name $sgName --description "BebeClick Security Group" --query GroupId --output text

# Add security rules
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3001 --cidr 0.0.0.0/0

Write-Host "Launching EC2 instance..." -ForegroundColor Blue

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
$instanceId = aws ec2 run-instances --image-id ami-0c02fb55956c7d316 --count 1 --instance-type t2.micro --key-name $keyName --security-group-ids $sgId --user-data file://userdata.txt --query "Instances[0].InstanceId" --output text

Write-Host "Instance launched: $instanceId" -ForegroundColor Green
Write-Host "Waiting for instance to be ready..." -ForegroundColor Yellow

# Wait for instance
aws ec2 wait instance-running --instance-ids $instanceId

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --query "Reservations[0].Instances[0].PublicIpAddress" --output text

Write-Host "Instance is ready!" -ForegroundColor Green
Write-Host "Public IP: $publicIp" -ForegroundColor Yellow
Write-Host "SSH Key: $keyName.pem" -ForegroundColor Cyan

# Create deployment info
$deploymentInfo = @"
BebeClick AWS Deployment Complete
=================================
Instance ID: $instanceId
Public IP: $publicIp
SSH Key: $keyName.pem
Security Group: $sgId

Manual Deployment Steps:
1. Upload app: scp -i $keyName.pem bebeclick-aws-production.zip ubuntu@$publicIp`:~/
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

$deploymentInfo | Out-File -FilePath "deployment-info.txt" -Encoding UTF8

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Server IP: $publicIp" -ForegroundColor Yellow
Write-Host "SSH Key: $keyName.pem" -ForegroundColor Cyan
Write-Host "Details: deployment-info.txt" -ForegroundColor White
Write-Host ""
Write-Host "Next: Upload and deploy your app manually using the steps in deployment-info.txt" -ForegroundColor Blue

# Clean up
Remove-Item "userdata.txt" -ErrorAction SilentlyContinue
