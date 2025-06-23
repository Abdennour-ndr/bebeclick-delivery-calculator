# استكشاف أخطاء النشر على Fly.io

## المشاكل الشائعة وحلولها

### 1. مشكلة تسجيل الدخول

#### الأعراض:
```
Error: not logged in
```

#### الحل:
```bash
flyctl auth login
```

### 2. مشكلة اسم التطبيق

#### الأعراض:
```
Error: app name 'calc-bebeclick' is not available
```

#### الحل:
```bash
# جرب اسم مختلف
flyctl apps create calc-bebeclick-2025
# أو
flyctl apps create bebeclick-calc
```

### 3. مشكلة البناء (Build)

#### الأعراض:
```
Error: failed to build
npm ERR! missing script: build
```

#### الحل:
تأكد من وجود script البناء في package.json:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

### 4. مشكلة Health Check

#### الأعراض:
```
Error: health check failed
```

#### الحل:
تأكد من أن `/health` endpoint يعمل:
```bash
# اختبار محلي
curl http://localhost:8080/health
```

### 5. مشكلة الذاكرة

#### الأعراض:
```
Error: out of memory
```

#### الحل:
زيادة الذاكرة في fly.toml:
```toml
[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### 6. مشكلة المنطقة

#### الأعراض:
```
Error: region not available
```

#### الحل:
تغيير المنطقة:
```toml
primary_region = 'fra'  # أو 'ams' أو 'lhr'
```

## خطوات التشخيص

### 1. فحص الحالة
```bash
flyctl status --app calc-bebeclick
```

### 2. عرض اللوجز
```bash
flyctl logs --app calc-bebeclick
```

### 3. فحص الإعدادات
```bash
flyctl config show --app calc-bebeclick
```

### 4. اختبار البناء محلياً
```bash
# بناء Docker محلياً
docker build -t calc-bebeclick .
docker run -p 8080:8080 calc-bebeclick

# اختبار health check
curl http://localhost:8080/health
```

## إعدادات محسنة

### fly.toml المحسن:
```toml
app = 'calc-bebeclick'
primary_region = 'cdg'

[build]

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1

[checks]
  [checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/health"
    port = 8080
    timeout = "5s"
    type = "http"
```

## أوامر النشر المحسنة

### النشر الأول:
```bash
# 1. تسجيل الدخول
flyctl auth login

# 2. إنشاء التطبيق
flyctl apps create calc-bebeclick

# 3. النشر
flyctl deploy

# 4. فتح التطبيق
flyctl open
```

### النشر المتقدم:
```bash
# نشر مع مراقبة اللوجز
flyctl deploy --verbose

# نشر مع تجاهل cache
flyctl deploy --no-cache

# نشر مع منطقة محددة
flyctl deploy --region cdg
```

## استكشاف أخطاء محددة

### خطأ "App not found":
```bash
# تأكد من وجود التطبيق
flyctl apps list

# إنشاء التطبيق إذا لم يكن موجود
flyctl apps create calc-bebeclick
```

### خطأ "Build failed":
```bash
# فحص لوجز البناء
flyctl logs --app calc-bebeclick

# بناء محلي للاختبار
npm run build
```

### خطأ "Health check timeout":
```bash
# فحص nginx config
cat nginx.conf

# اختبار health endpoint
curl https://calc-bebeclick.fly.dev/health
```

## بدائل النشر

### إذا فشل Fly.io:

#### 1. Netlify (سهل):
```bash
npm run build
# ارفع مجلد dist إلى netlify.com
```

#### 2. Vercel (سريع):
```bash
npm install -g vercel
vercel --prod
```

#### 3. Surge.sh (يعمل حالياً):
```bash
npm run build
npx surge dist calc-bebeclick.surge.sh
```

## معلومات الدعم

### روابط مفيدة:
- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)
- [Fly.io Status](https://status.fly.io/)

### للمساعدة:
```bash
flyctl help
flyctl help deploy
flyctl help apps
```

## الحل السريع

إذا كنت تواجه مشاكل، جرب هذا:

```bash
# 1. حذف التطبيق الحالي (إذا موجود)
flyctl apps destroy calc-bebeclick

# 2. إنشاء تطبيق جديد
flyctl apps create bebeclick-delivery-calc

# 3. تحديث fly.toml
# غير app = 'bebeclick-delivery-calc'

# 4. النشر
flyctl deploy

# 5. فحص الحالة
flyctl status
flyctl logs
```

---

**ملاحظة**: التطبيق يعمل حالياً على Surge.sh بدون مشاكل على:
https://calc-bebeclick.surge.sh
