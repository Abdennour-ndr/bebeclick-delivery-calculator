# Fix AWS Credentials
Write-Host "Fixing AWS Credentials..." -ForegroundColor Yellow

$awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "Current AWS Configuration:" -ForegroundColor Blue
& $awsPath configure list

Write-Host ""
Write-Host "The current credentials are invalid." -ForegroundColor Red
Write-Host "You need to get new AWS credentials." -ForegroundColor Yellow

Write-Host ""
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "1. Get new Secret Access Key from AWS Console" -ForegroundColor White
Write-Host "2. Use AWS Console to deploy manually" -ForegroundColor White
Write-Host "3. Create new IAM user with proper permissions" -ForegroundColor White

Write-Host ""
Write-Host "To get new credentials:" -ForegroundColor Green
Write-Host "1. Go to: https://console.aws.amazon.com/iam/" -ForegroundColor White
Write-Host "2. Users -> Select your user" -ForegroundColor White
Write-Host "3. Security credentials -> Create access key" -ForegroundColor White
Write-Host "4. Save both Access Key ID and Secret Access Key" -ForegroundColor White

Write-Host ""
$choice = Read-Host "Do you want to enter new credentials now? (y/n)"

if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host ""
    $newAccessKey = Read-Host "Enter new Access Key ID"
    $newSecretKey = Read-Host "Enter new Secret Access Key" -AsSecureString
    $newSecretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($newSecretKey))
    
    Write-Host "Updating AWS configuration..." -ForegroundColor Blue
    & $awsPath configure set aws_access_key_id $newAccessKey
    & $awsPath configure set aws_secret_access_key $newSecretKeyPlain
    
    Write-Host "Testing new credentials..." -ForegroundColor Blue
    try {
        $identity = & $awsPath sts get-caller-identity | ConvertFrom-Json
        Write-Host "SUCCESS! New credentials work" -ForegroundColor Green
        Write-Host "Account: $($identity.Account)" -ForegroundColor Cyan
        Write-Host "User: $($identity.Arn)" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Ready to deploy! Run: .\deploy-aws.ps1" -ForegroundColor Yellow
        
    } catch {
        Write-Host "FAILED! New credentials are also invalid" -ForegroundColor Red
        Write-Host "Please check your credentials again" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Manual deployment option:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://console.aws.amazon.com/ec2/" -ForegroundColor White
    Write-Host "2. Launch Instance -> Ubuntu 22.04 LTS -> t2.micro" -ForegroundColor White
    Write-Host "3. Create key pair and security group" -ForegroundColor White
    Write-Host "4. Launch instance and get Public IP" -ForegroundColor White
    Write-Host "5. Upload app: scp -i key.pem bebeclick-aws-production.zip ubuntu@IP:~/" -ForegroundColor White
}
