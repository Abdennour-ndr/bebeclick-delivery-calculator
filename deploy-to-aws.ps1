# ===================================
# AWS Deployment Script for Windows
# BebeClick Delivery Calculator
# ===================================

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyPath,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [string]$ServerUser = "ubuntu"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Blue
    
    # Check if SSH key exists
    if (-not (Test-Path $KeyPath)) {
        Write-ColorOutput "❌ SSH key not found: $KeyPath" $Red
        exit 1
    }
    
    # Check if required files exist
    $requiredFiles = @("package.json", "server.production.js", "aws-deploy.sh")
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-ColorOutput "❌ Required file not found: $file" $Red
            exit 1
        }
    }
    
    Write-ColorOutput "✅ Prerequisites check passed" $Green
}

function Build-Application {
    Write-ColorOutput "🏗️ Building optimized production version..." $Blue
    
    try {
        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-ColorOutput "📦 Installing dependencies..." $Yellow
            npm install
        }
        
        # Build optimized version
        Write-ColorOutput "⚙️ Building production bundle..." $Yellow
        npm run build:complete
        
        Write-ColorOutput "✅ Build completed successfully" $Green
    }
    catch {
        Write-ColorOutput "❌ Build failed: $($_.Exception.Message)" $Red
        exit 1
    }
}

function Create-DeploymentPackage {
    Write-ColorOutput "📦 Creating deployment package..." $Blue
    
    try {
        # Create temporary directory
        $tempDir = "temp-deploy"
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        
        # Copy required files
        $filesToCopy = @(
            @{Source = "dist"; Destination = "$tempDir/dist"},
            @{Source = "server.production.js"; Destination = "$tempDir/server.js"},
            @{Source = "package.json"; Destination = "$tempDir/package.json"},
            @{Source = "package-lock.json"; Destination = "$tempDir/package-lock.json"},
            @{Source = "src"; Destination = "$tempDir/src"},
            @{Source = "aws-deploy.sh"; Destination = "$tempDir/aws-deploy.sh"}
        )
        
        foreach ($file in $filesToCopy) {
            if (Test-Path $file.Source) {
                Copy-Item $file.Source $file.Destination -Recurse -Force
                Write-ColorOutput "📄 Copied: $($file.Source)" $Yellow
            }
        }
        
        # Create tar.gz package (requires tar command or 7zip)
        $packageName = "bebeclick-production.tar.gz"
        
        if (Get-Command tar -ErrorAction SilentlyContinue) {
            tar -czf $packageName -C $tempDir .
        } else {
            # Fallback to zip if tar not available
            $packageName = "bebeclick-production.zip"
            Compress-Archive -Path "$tempDir/*" -DestinationPath $packageName -Force
        }
        
        # Cleanup temp directory
        Remove-Item $tempDir -Recurse -Force
        
        Write-ColorOutput "✅ Package created: $packageName" $Green
        return $packageName
    }
    catch {
        Write-ColorOutput "❌ Package creation failed: $($_.Exception.Message)" $Red
        exit 1
    }
}

function Upload-Files {
    param([string]$PackageName)
    
    Write-ColorOutput "📤 Uploading files to server..." $Blue
    
    try {
        # Upload package
        Write-ColorOutput "📦 Uploading deployment package..." $Yellow
        scp -i $KeyPath $PackageName "${ServerUser}@${ServerIP}:~/"
        
        # Upload deployment script
        Write-ColorOutput "📜 Uploading deployment script..." $Yellow
        scp -i $KeyPath aws-deploy.sh "${ServerUser}@${ServerIP}:~/"
        
        Write-ColorOutput "✅ Files uploaded successfully" $Green
    }
    catch {
        Write-ColorOutput "❌ Upload failed: $($_.Exception.Message)" $Red
        exit 1
    }
}

function Deploy-Application {
    param([string]$PackageName)
    
    Write-ColorOutput "🚀 Deploying application on server..." $Blue
    
    try {
        # Extract package and run deployment
        $deployCommands = @(
            "cd ~",
            "chmod +x aws-deploy.sh",
            "sudo ./aws-deploy.sh"
        )
        
        foreach ($command in $deployCommands) {
            Write-ColorOutput "🔧 Executing: $command" $Yellow
            ssh -i $KeyPath "${ServerUser}@${ServerIP}" $command
        }
        
        Write-ColorOutput "✅ Deployment completed successfully" $Green
    }
    catch {
        Write-ColorOutput "❌ Deployment failed: $($_.Exception.Message)" $Red
        exit 1
    }
}

function Test-Deployment {
    Write-ColorOutput "🧪 Testing deployment..." $Blue
    
    try {
        # Test health endpoint
        $healthUrl = "http://${ServerIP}/health"
        Write-ColorOutput "🔍 Testing: $healthUrl" $Yellow
        
        $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 30
        
        if ($response.status -eq "OK") {
            Write-ColorOutput "✅ Health check passed" $Green
            Write-ColorOutput "🌐 Application is running at: http://${ServerIP}" $Green
        } else {
            Write-ColorOutput "⚠️ Health check returned unexpected status" $Yellow
        }
    }
    catch {
        Write-ColorOutput "⚠️ Health check failed, but deployment may still be successful" $Yellow
        Write-ColorOutput "🌐 Try accessing: http://${ServerIP}" $Blue
    }
}

function Show-PostDeploymentInfo {
    Write-ColorOutput "`n🎉 Deployment Summary" $Green
    Write-ColorOutput "===================" $Green
    Write-ColorOutput "🌐 Application URL: http://${ServerIP}" $Blue
    Write-ColorOutput "🔍 Health Check: http://${ServerIP}/health" $Blue
    Write-ColorOutput "📊 Detailed Health: http://${ServerIP}/health/detailed" $Blue
    Write-ColorOutput "`n📋 Useful Commands:" $Yellow
    Write-ColorOutput "ssh -i $KeyPath ${ServerUser}@${ServerIP}" $Blue
    Write-ColorOutput "pm2 status" $Blue
    Write-ColorOutput "pm2 logs" $Blue
    Write-ColorOutput "sudo systemctl status nginx" $Blue
    Write-ColorOutput "`n✅ Deployment completed successfully!" $Green
}

# Main execution
try {
    Write-ColorOutput "🚀 Starting AWS Deployment for BebeClick Calculator" $Green
    Write-ColorOutput "=================================================" $Green
    
    Test-Prerequisites
    Build-Application
    $packageName = Create-DeploymentPackage
    Upload-Files -PackageName $packageName
    Deploy-Application -PackageName $packageName
    
    # Wait a moment for services to start
    Write-ColorOutput "⏳ Waiting for services to start..." $Yellow
    Start-Sleep -Seconds 10
    
    Test-Deployment
    Show-PostDeploymentInfo
    
    # Cleanup local package
    if (Test-Path $packageName) {
        Remove-Item $packageName -Force
        Write-ColorOutput "🧹 Cleaned up local package" $Yellow
    }
}
catch {
    Write-ColorOutput "❌ Deployment failed: $($_.Exception.Message)" $Red
    Write-ColorOutput "📞 Check the logs and try again" $Yellow
    exit 1
}
