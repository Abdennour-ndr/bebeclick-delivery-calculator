# 🚀 نشر BebeClick على AWS - جاهز للتشغيل!

## 📋 معلومات الخادم
- **IP**: `54.234.157.25`
- **DNS**: `ec2-54-234-157-25.compute-1.amazonaws.com`
- **مفتاح SSH**: `bebeclick-07010344.pem`
- **نظام التشغيل**: Ubuntu 22.04

## ⚡ النشر الفوري (خطوة واحدة)

### تشغيل سكريبت النشر التلقائي:
```powershell
.\deploy-bebeclick.ps1
```

أو مع معاملات مخصصة:
```powershell
.\deploy-bebeclick.ps1 -KeyPath "bebeclick-07010344.pem" -ServerIP "54.234.157.25"
```

## 📦 ما سيحدث تلقائياً:

1. ✅ **فحص المتطلبات** - التأكد من وجود الملفات
2. ✅ **رفع الحزمة** - `bebeclick-production.zip`
3. ✅ **رفع سكريبت النشر** - `aws-deploy.sh`
4. ✅ **تثبيت النظام** - Node.js, PM2, Nginx
5. ✅ **نشر التطبيق** - في `/opt/bebeclick-calculator/`
6. ✅ **تكوين الخدمات** - PM2 + Nginx
7. ✅ **اختبار النشر** - Health check
8. ✅ **فتح المتصفح** - للتطبيق

## 🔧 بعد النشر - إعداد متغيرات البيئة:

### 1. الاتصال بالخادم:
```bash
ssh -i bebeclick-07010344.pem ubuntu@54.234.157.25
```

### 2. تحديث متغيرات البيئة:
```bash
cd /opt/bebeclick-calculator/current
sudo nano .env
```

### 3. إضافة/تحديث المتغيرات:
```env
# Firebase (استخدم قيمك الحقيقية)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Google Maps (جاهز)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD5T2bD2sqxQ90y4pJc8WEWyihlAJiYZKA

# MongoDB (جاهز)
MONGODB_URI=mongodb+srv://bebeclick_user:BebeClick2025!@bebeclick-cluster.nuicimc.mongodb.net/?retryWrites=true&w=majority&appName=BebeClick-Cluster

# Yalidine API (جاهز)
YALIDINE_API_ID=53332088154627079445
YALIDINE_API_TOKEN=C3BpezWbhXURmYJnddfLgKKB49j1e6s1pZ8HMPT2lNSOQulb5EqMF8PQLaFrgii6

# Infobip WhatsApp (جاهز)
INFOBIP_API_KEY=aa3aa4f1d8c77c81eb410f15945609bf-1b00ae75-8c73-4f37-a5ce-2aac4d07980c

# Production Settings
NODE_ENV=production
PORT=3001
```

### 4. إعادة تشغيل التطبيق:
```bash
pm2 restart bebeclick-backend
```

## 🌐 النتائج المتوقعة:

✅ **الموقع**: http://54.234.157.25  
✅ **Health Check**: http://54.234.157.25/health  
✅ **API**: http://54.234.157.25/api/  

## 📊 مراقبة التطبيق:

### فحص الحالة:
```bash
pm2 status
pm2 logs
sudo systemctl status nginx
```

### فحص الأداء:
```bash
free -h          # الذاكرة
htop             # المعالج
pm2 monit        # مراقبة PM2
```

## 🚨 استكشاف الأخطاء:

### إذا لم يعمل التطبيق:
```bash
# فحص اللوجز
pm2 logs bebeclick-backend

# إعادة تشغيل
pm2 restart bebeclick-backend

# فحص Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### إذا كانت الذاكرة ممتلئة:
```bash
# إضافة Swap
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 🎯 الميزات المتاحة بعد النشر:

✅ **حاسبة التوصيل** - جميع شركات التوصيل  
✅ **إدارة المنتجات** - CRUD كامل  
✅ **Google Maps** - Places Autocomplete  
✅ **WhatsApp Integration** - إرسال تلقائي  
✅ **Barcode Scanner** - مسح الباركود  
✅ **Mobile Responsive** - متجاوب مع الجوال  
✅ **Real-time Pricing** - أسعار محدثة  
✅ **Multi-zone Support** - 5 مناطق  

## 📞 الدعم:

إذا احتجت مساعدة:
1. تحقق من اللوجز أولاً: `pm2 logs`
2. تأكد من متغيرات البيئة: `cat .env`
3. فحص الاتصال: `curl http://54.234.157.25/health`

**جاهز للنشر! اضغط Enter وانتظر 5 دقائق! 🎉**
