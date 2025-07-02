# Test AWS Connection
Write-Host "Testing AWS Setup..." -ForegroundColor Green

# Check AWS CLI
try {
    $version = aws --version 2>$null
    if ($version) {
        Write-Host "AWS CLI found: $version" -ForegroundColor Green
    } else {
        Write-Host "AWS CLI not found!" -ForegroundColor Red
        Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "AWS CLI not installed!" -ForegroundColor Red
    exit 1
}

# Test credentials
Write-Host "Testing AWS credentials..." -ForegroundColor Blue

$env:AWS_ACCESS_KEY_ID = "AKIA54HZXHAVNBH6KAR4"
$secretKey = Read-Host "Enter Secret Access Key" -AsSecureString
$env:AWS_SECRET_ACCESS_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))
$env:AWS_DEFAULT_REGION = "us-east-1"

try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "SUCCESS! AWS credentials work" -ForegroundColor Green
    Write-Host "Account: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "User: $($identity.Arn)" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Ready to deploy! Run the main deployment script." -ForegroundColor Yellow
    
} catch {
    Write-Host "FAILED! Invalid credentials" -ForegroundColor Red
    Write-Host "Check your Secret Access Key" -ForegroundColor Yellow
}
