# 🚀 تعليمات نشر BebeClick Delivery Calculator على AWS EC2

## 📋 المتطلبات المسبقة
- حساب AWS
- ملف `bebeclick-app.zip` (تم إنشاؤه)

## 🔧 الخطوة 1: إنشاء EC2 Instance

### 1.1 إنشاء Instance
1. اذهب إلى [AWS Console](https://console.aws.amazon.com)
2. اختر **EC2** من الخدمات
3. انقر **Launch Instance**
4. اختر **Ubuntu Server 22.04 LTS (Free Tier)**
5. اختر **t2.micro** (مجاني)
6. أنشئ **Key Pair** جديد:
   - الاسم: `bebeclick-key`
   - النوع: `.pem`
   - احفظ الملف في مجلد آمن

### 1.2 إعداد Security Group
في **Security Groups**، أضف القواعد التالية:
- **SSH (22)** - Source: My IP
- **HTTP (80)** - Source: Anywhere
- **Custom TCP (3000)** - Source: Anywhere
- **HTTPS (443)** - Source: Anywhere

### 1.3 إطلاق Instance
- انقر **Launch Instance**
- انتظر حتى يصبح Status: **Running**
- احفظ **Public IPv4 address**

## 🔗 الخطوة 2: الاتصال بالخادم

### 2.1 تحضير مفتاح SSH (Windows)
```powershell
# في PowerShell
icacls "path\to\bebeclick-key.pem" /inheritance:r
icacls "path\to\bebeclick-key.pem" /grant:r "%username%:R"
```

### 2.2 الاتصال
```bash
ssh -i "path/to/bebeclick-key.pem" ubuntu@YOUR-EC2-PUBLIC-IP
```

## ⚙️ الخطوة 3: إعداد الخادم

### 3.1 تحديث النظام
```bash
sudo apt update && sudo apt upgrade -y
```

### 3.2 تثبيت Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3.3 تثبيت PM2
```bash
sudo npm install -g pm2
```

### 3.4 تثبيت unzip
```bash
sudo apt install unzip -y
```

## 📤 الخطوة 4: رفع التطبيق

### 4.1 رفع الملف المضغوط
من جهازك المحلي:
```bash
scp -i "path/to/bebeclick-key.pem" bebeclick-app.zip ubuntu@YOUR-EC2-PUBLIC-IP:/home/ubuntu/
```

### 4.2 استخراج الملفات
على الخادم:
```bash
cd /home/ubuntu
unzip bebeclick-app.zip
ls -la  # للتأكد من وجود الملفات
```

### 4.3 إعداد التطبيق
```bash
# نسخ package.json
cp server-package.json package.json

# تثبيت التبعيات
npm install --production

# إعادة تسمية ملف الخادم
mv production-server.js server.js
```

## 🚀 الخطوة 5: تشغيل التطبيق

### 5.1 تشغيل مع PM2
```bash
pm2 start server.js --name bebeclick-delivery-calculator
pm2 save
pm2 startup
```

### 5.2 التحقق من الحالة
```bash
pm2 status
pm2 logs bebeclick-delivery-calculator
```

## 🌐 الخطوة 6: الوصول للتطبيق

### 6.1 فتح التطبيق
```
http://YOUR-EC2-PUBLIC-IP:3000
```

### 6.2 فحص الصحة
```
http://YOUR-EC2-PUBLIC-IP:3000/health
```

## 🔧 أوامر مفيدة

### إعادة تشغيل التطبيق
```bash
pm2 restart bebeclick-delivery-calculator
```

### إيقاف التطبيق
```bash
pm2 stop bebeclick-delivery-calculator
```

### عرض اللوجز
```bash
pm2 logs bebeclick-delivery-calculator --lines 100
```

### تحديث التطبيق
```bash
# رفع ملف جديد
scp -i "path/to/bebeclick-key.pem" bebeclick-app.zip ubuntu@YOUR-EC2-PUBLIC-IP:/home/ubuntu/

# على الخادم
cd /home/ubuntu
pm2 stop bebeclick-delivery-calculator
rm -rf dist/ server.js package.json node_modules/
unzip -o bebeclick-app.zip
cp server-package.json package.json
mv production-server.js server.js
npm install --production
pm2 start server.js --name bebeclick-delivery-calculator
```

## 🛡️ الأمان

### إعداد Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 3000
sudo ufw allow 80
sudo ufw allow 443
```

### تحديثات الأمان
```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

## 📊 المراقبة

### مراقبة الموارد
```bash
htop  # تثبيت: sudo apt install htop
df -h  # مساحة القرص
free -h  # الذاكرة
```

### مراقبة PM2
```bash
pm2 monit
```

## 🎉 تم!

التطبيق الآن يعمل على:
- **URL**: http://YOUR-EC2-PUBLIC-IP:3000
- **Health Check**: http://YOUR-EC2-PUBLIC-IP:3000/health
- **API Status**: http://YOUR-EC2-PUBLIC-IP:3000/api/status

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من لوجز PM2: `pm2 logs`
2. تحقق من حالة الخادم: `pm2 status`
3. تحقق من Security Groups في AWS Console
4. تأكد من أن المنفذ 3000 مفتوح
