# 🚀 نشر فوري على AWS - دليل سريع

## 📋 ما تحتاجه (5 دقائق)

1. **حساب AWS** مع EC2 Instance جاهز
2. **مفتاح SSH** (.pem file)
3. **IP الخادم** (من AWS Console)

## ⚡ النشر السريع (خطوة واحدة)

### للمستخدمين Windows:
```powershell
# استبدل المسارات بالقيم الصحيحة
.\deploy-to-aws.ps1 -KeyPath "C:\path\to\your-key.pem" -ServerIP "your-ec2-ip"
```

### للمستخدمين Linux/Mac:
```bash
# 1. بناء التطبيق
npm run build:complete

# 2. إنشاء حزمة النشر
tar -czf bebeclick-production.tar.gz dist/ server.production.js package.json src/ aws-deploy.sh

# 3. رفع ونشر
scp -i your-key.pem bebeclick-production.tar.gz ubuntu@your-ec2-ip:~/
scp -i your-key.pem aws-deploy.sh ubuntu@your-ec2-ip:~/
ssh -i your-key.pem ubuntu@your-ec2-ip "chmod +x aws-deploy.sh && sudo ./aws-deploy.sh"
```

## 🔧 إعداد متغيرات البيئة (بعد النشر)

```bash
# الاتصال بالخادم
ssh -i your-key.pem ubuntu@your-ec2-ip

# إعداد متغيرات البيئة
cd /opt/bebeclick-calculator/current
sudo nano .env

# إضافة المتغيرات (انسخ من .env.production.example)
# ثم احفظ واخرج

# إعادة تشغيل التطبيق
pm2 restart bebeclick-backend
```

## ✅ التحقق من النجاح

بعد النشر، تحقق من:
- 🌐 **الموقع**: `http://your-ec2-ip`
- 🔍 **Health Check**: `http://your-ec2-ip/health`
- 📊 **تفاصيل**: `http://your-ec2-ip/health/detailed`

## 🚨 إذا واجهت مشاكل

### 1. فحص الحالة
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
pm2 status
sudo systemctl status nginx
```

### 2. فحص اللوجز
```bash
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

### 3. إعادة تشغيل الخدمات
```bash
pm2 restart bebeclick-backend
sudo systemctl restart nginx
```

## 🎯 النتيجة المتوقعة

✅ **موقع يعمل بكفاءة عالية:**
- ⚡ وقت التحميل: < 2 ثانية
- 💾 استخدام الذاكرة: < 400MB
- 🔒 آمن ومحمي
- 📱 متجاوب مع الجوال
- 🌍 جاهز للإنتاج

## 📞 الدعم

إذا احتجت مساعدة:
1. تحقق من اللوجز أولاً
2. تأكد من إعداد متغيرات البيئة
3. تحقق من Security Groups في AWS

**مبروك! تطبيقك الآن على AWS! 🎉**
