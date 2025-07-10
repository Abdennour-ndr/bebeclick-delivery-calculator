# 🚀 دليل النشر السريع على AWS EC2

## 📋 المتطلبات
- حساب AWS
- مفتاح SSH (.pem file)
- التطبيق جاهز للنشر

## 🏗️ الخطوة 1: إنشاء EC2 Instance

### 1. إعداد الخادم
```bash
# في AWS Console:
# 1. اذهب إلى EC2 → Launch Instance
# 2. اختر Ubuntu 22.04 LTS
# 3. اختر t2.micro (Free Tier)
# 4. إنشاء Key Pair وحفظه
# 5. Security Group: SSH(22), HTTP(80), HTTPS(443)
```

### 2. الاتصال بالخادم
```bash
# استبدل your-key.pem و your-ec2-ip بالقيم الصحيحة
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

## 📦 الخطوة 2: تحضير التطبيق للنشر

### 1. بناء النسخة المحسنة
```bash
# في مجلد المشروع على جهازك المحلي
npm run build:complete
```

### 2. إنشاء حزمة النشر
```bash
# إنشاء ملف مضغوط للنشر
tar -czf bebeclick-production.tar.gz \
  dist/ \
  server.production.js \
  package.json \
  package-lock.json \
  src/ \
  aws-deploy.sh
```

### 3. رفع الملفات للخادم
```bash
# رفع الحزمة
scp -i your-key.pem bebeclick-production.tar.gz ubuntu@your-ec2-ip:~/

# رفع سكريبت النشر
scp -i your-key.pem aws-deploy.sh ubuntu@your-ec2-ip:~/
```

## 🚀 الخطوة 3: النشر التلقائي

### 1. تشغيل سكريبت النشر
```bash
# على الخادم
cd ~
chmod +x aws-deploy.sh
sudo ./aws-deploy.sh
```

### 2. التحقق من النشر
```bash
# فحص حالة الخدمات
pm2 status
sudo systemctl status nginx

# فحص اللوجز
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

## 🔧 الخطوة 4: إعداد متغيرات البيئة

### 1. إعداد Firebase
```bash
# على الخادم
cd /opt/bebeclick-calculator/current
sudo nano .env
```

### 2. إضافة المتغيرات
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD5T2bD2sqxQ90y4pJc8WEWyihlAJiYZKA

# Production Settings
NODE_ENV=production
PORT=3001
```

### 3. إعادة تشغيل التطبيق
```bash
pm2 restart bebeclick-backend
```

## 🌐 الخطوة 5: إعداد Domain (اختياري)

### 1. ربط Domain
```bash
# في إعدادات DNS الخاص بك
# أضف A Record يشير إلى IP الخادم
```

### 2. إعداد SSL مع Let's Encrypt
```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d yourdomain.com

# تجديد تلقائي
sudo crontab -e
# أضف: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 الخطوة 6: المراقبة والصيانة

### 1. فحص الأداء
```bash
# استخدام الذاكرة
free -h

# استخدام المعالج
htop

# حالة PM2
pm2 monit
```

### 2. النسخ الاحتياطي
```bash
# إنشاء نسخة احتياطية
sudo tar -czf /opt/backups/backup-$(date +%Y%m%d).tar.gz \
  /opt/bebeclick-calculator/current
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة:

#### 1. خطأ في الذاكرة
```bash
# إضافة Swap
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 2. خطأ في Nginx
```bash
# فحص التكوين
sudo nginx -t

# إعادة تشغيل
sudo systemctl restart nginx
```

#### 3. خطأ في التطبيق
```bash
# فحص اللوجز
pm2 logs bebeclick-backend

# إعادة تشغيل
pm2 restart bebeclick-backend
```

## ✅ التحقق من النجاح

بعد النشر الناجح:
- ✅ الموقع يعمل على: `http://your-ec2-ip`
- ✅ API يستجيب على: `http://your-ec2-ip/health`
- ✅ استخدام الذاكرة < 400MB
- ✅ وقت التحميل < 2 ثانية

## 📞 الدعم

للمساعدة:
```bash
# فحص الحالة العامة
curl http://your-ec2-ip/health

# فحص تفصيلي
curl http://your-ec2-ip/health/detailed
```

**النشر مكتمل بنجاح! 🎉**
