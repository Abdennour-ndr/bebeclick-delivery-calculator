# نشر تطبيق BebeClick Delivery Calculator

## منصة النشر

### Fly.io (الإنتاج)
```
https://calc-bebeclick.fly.dev
```
**المزايا:** خوادم في أوروبا، أداء ممتاز، SSL تلقائي، دعم Docker

## خطوات النشر اليدوي

### 1. تثبيت Fly.io CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

### 2. تسجيل الدخول
```bash
flyctl auth login
```

### 3. إنشاء التطبيق
```bash
flyctl apps create calc-bebeclick
```

### 4. نشر التطبيق
```bash
flyctl deploy
```

## النشر البديل - GitHub Pages (مجاني)

### 1. إعداد Repository
1. ارفع الكود إلى GitHub repository
2. اذهب إلى Settings → Pages
3. اختر Source: GitHub Actions
4. سيتم النشر تلقائياً على كل push

### 2. الرابط
```
https://[username].github.io/[repository-name]
```

## النشر البديل - Netlify

### 1. الطريقة السهلة
1. اذهب إلى [netlify.com](https://netlify.com)
2. اسحب مجلد `dist` بعد تشغيل `npm run build`
3. سيتم النشر فوراً

### 2. الربط مع GitHub
1. ربط Repository مع Netlify
2. سيتم النشر تلقائياً مع ملف `netlify.toml`

## النشر البديل - Vercel

### 1. الطريقة السريعة
```bash
npm i -g vercel
vercel --prod
```

### 2. الربط مع GitHub
1. ربط Repository مع Vercel
2. سيتم النشر تلقائياً مع ملف `vercel.json`

## النشر التلقائي عبر GitHub Actions

### 1. إعداد Repository
1. ارفع الكود إلى GitHub repository
2. اذهب إلى Settings → Secrets and variables → Actions
3. أضف secret جديد:
   - Name: `FLY_API_TOKEN`
   - Value: [احصل على التوكن من fly.io dashboard]

### 2. الحصول على FLY_API_TOKEN
```bash
flyctl auth token
```

### 3. النشر التلقائي
- كل push إلى main/master branch سيؤدي إلى نشر تلقائي
- يمكن تشغيل النشر يدوياً من تبويب Actions

## إعدادات التطبيق

### المواصفات
- **Memory**: 1GB
- **CPU**: 1 shared CPU
- **Region**: CDG (Paris) - الأقرب للجزائر
- **Port**: 8080
- **HTTPS**: مفعل تلقائياً

### الميزات
- **Auto-scaling**: يتوقف عند عدم الاستخدام
- **Gzip compression**: مفعل
- **Static file caching**: مفعل لمدة سنة
- **Security headers**: مفعلة
- **Health check**: متاح على `/health`

## الملفات المطلوبة للنشر

### 1. `fly.toml` - إعدادات Fly.io
- تحديد اسم التطبيق والمنطقة
- إعدادات الذاكرة والمعالج
- إعدادات HTTP

### 2. `Dockerfile` - بناء التطبيق
- مرحلة البناء مع Node.js
- مرحلة الإنتاج مع Nginx
- تحسينات الأداء

### 3. `nginx.conf` - إعدادات الخادم
- ضغط Gzip
- Cache للملفات الثابتة
- Security headers
- Client-side routing support

### 4. `.dockerignore` - تحسين البناء
- استبعاد الملفات غير المطلوبة
- تقليل حجم الصورة

## التحقق من النشر

### 1. فحص الحالة
```bash
flyctl status
```

### 2. عرض اللوجز
```bash
flyctl logs
```

### 3. فتح التطبيق
```bash
flyctl open
```

## إدارة التطبيق

### إيقاف التطبيق
```bash
flyctl apps suspend calc-bebeclick
```

### تشغيل التطبيق
```bash
flyctl apps resume calc-bebeclick
```

### حذف التطبيق
```bash
flyctl apps destroy calc-bebeclick
```

## استكشاف الأخطاء

### مشكلة في البناء
```bash
flyctl logs --app calc-bebeclick
```

### مشكلة في الاتصال
- تحقق من إعدادات الشبكة
- تأكد من أن المنافذ صحيحة

### مشكلة في الأداء
- راقب استخدام الذاكرة
- تحقق من لوجز الأخطاء

## الأمان

### HTTPS
- مفعل تلقائياً مع شهادة SSL مجانية
- إعادة توجيه تلقائية من HTTP إلى HTTPS

### Headers الأمان
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## التكلفة

### الاستخدام المجاني
- 3 تطبيقات مجانية
- 160GB bandwidth شهرياً
- مشاركة CPU

### التكلفة المتوقعة
- للاستخدام الداخلي: مجاني تماماً
- Auto-scaling يوفر في التكاليف

## الدعم

للمساعدة:
1. راجع [Fly.io Documentation](https://fly.io/docs/)
2. تحقق من [Community Forum](https://community.fly.io/)
3. استخدم `flyctl help` للمساعدة
