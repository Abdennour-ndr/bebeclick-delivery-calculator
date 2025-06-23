# نشر سريع لـ BebeClick Calculator

## خيارات النشر السريع

### 🚀 الخيار الأول: Fly.io
🌐 **https://calc-bebeclick.fly.dev**

### 📄 الخيار الثاني: GitHub Pages (مجاني)
🌐 **https://[username].github.io/delivery-cost-calculator**

### ⚡ الخيار الثالث: Netlify (سهل)
🌐 **https://calc-bebeclick.netlify.app**

### 🔥 الخيار الرابع: Vercel (سريع)
🌐 **https://calc-bebeclick.vercel.app**

## خطوات النشر حسب الخدمة

### A. Fly.io (احترافي)

#### 1. تثبيت CLI
**Windows:**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. النشر
```bash
flyctl auth login
flyctl apps create calc-bebeclick
flyctl deploy
```

### B. GitHub Pages (مجاني)

#### 1. رفع الكود
```bash
git add .
git commit -m "Deploy BebeClick Calculator"
git push origin main
```

#### 2. تفعيل Pages
- اذهب إلى Settings → Pages
- اختر Source: GitHub Actions
- سيتم النشر تلقائياً

### C. Netlify (سهل)

#### 1. بناء التطبيق
```bash
npm run build
```

#### 2. النشر
- اذهب إلى [netlify.com](https://netlify.com)
- اسحب مجلد `dist`
- تم!

### D. Vercel (سريع)

#### 1. تثبيت CLI
```bash
npm i -g vercel
```

#### 2. النشر
```bash
vercel --prod
```

## بعد النشر

### فتح التطبيق
```bash
flyctl open
```

### مراقبة الحالة
```bash
flyctl status
flyctl logs
```

### إيقاف/تشغيل
```bash
flyctl apps suspend calc-bebeclick  # إيقاف
flyctl apps resume calc-bebeclick   # تشغيل
```

## المواصفات
- **Memory**: 512MB
- **CPU**: 1 shared
- **Region**: Paris (CDG)
- **Auto-scaling**: نعم
- **HTTPS**: تلقائي
- **Cost**: مجاني للاستخدام الداخلي

## استكشاف الأخطاء
```bash
flyctl logs --app calc-bebeclick
flyctl status --app calc-bebeclick
```

---
**تم إعداده بواسطة BebeClick Development Team**
