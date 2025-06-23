# BebeClick Delivery Calculator - Deploy Script for Windows
Write-Host "🚀 نشر تطبيق BebeClick Delivery Calculator على Fly.io" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# التحقق من وجود flyctl
try {
    flyctl version | Out-Null
    Write-Host "✅ flyctl مثبت" -ForegroundColor Green
} catch {
    Write-Host "❌ flyctl غير مثبت. يرجى تثبيته أولاً:" -ForegroundColor Red
    Write-Host "iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

# التحقق من تسجيل الدخول
try {
    flyctl auth whoami | Out-Null
    Write-Host "✅ مسجل الدخول في flyctl" -ForegroundColor Green
} catch {
    Write-Host "❌ يرجى تسجيل الدخول أولاً:" -ForegroundColor Red
    Write-Host "flyctl auth login" -ForegroundColor Yellow
    exit 1
}

# بناء التطبيق
Write-Host "📦 بناء التطبيق..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل في بناء التطبيق" -ForegroundColor Red
    exit 1
}

Write-Host "✅ تم بناء التطبيق بنجاح" -ForegroundColor Green

# التحقق من وجود التطبيق
$appExists = flyctl apps list | Select-String "calc-bebeclick"

if (-not $appExists) {
    Write-Host "📱 إنشاء تطبيق جديد..." -ForegroundColor Blue
    flyctl apps create calc-bebeclick
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ فشل في إنشاء التطبيق" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ تم إنشاء التطبيق calc-bebeclick" -ForegroundColor Green
} else {
    Write-Host "✅ التطبيق calc-bebeclick موجود" -ForegroundColor Green
}

# نشر التطبيق
Write-Host "🚀 نشر التطبيق..." -ForegroundColor Blue
flyctl deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 تم النشر بنجاح!" -ForegroundColor Green
    Write-Host "🌐 الرابط: https://calc-bebeclick.fly.dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 لعرض حالة التطبيق:" -ForegroundColor Yellow
    Write-Host "flyctl status" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 لعرض اللوجز:" -ForegroundColor Yellow
    Write-Host "flyctl logs" -ForegroundColor White
    Write-Host ""
    Write-Host "🌍 لفتح التطبيق:" -ForegroundColor Yellow
    Write-Host "flyctl open" -ForegroundColor White
} else {
    Write-Host "❌ فشل في النشر" -ForegroundColor Red
    Write-Host "📋 تحقق من اللوجز:" -ForegroundColor Yellow
    Write-Host "flyctl logs" -ForegroundColor White
    exit 1
}
