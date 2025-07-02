# 🚀 دليل النشر اليدوي على AWS

## 📋 **الطريقة 1: استخدام AWS Console (الأسهل)**

### **1. إنشاء EC2 Instance:**

1. **اذهب إلى AWS Console:**
   - https://console.aws.amazon.com/ec2/

2. **انقر "Launch Instance"**

3. **اختر الإعدادات:**
   - **Name**: `bebeclick-server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type**: t2.micro (Free tier eligible)
   - **Key pair**: Create new key pair
     - Name: `bebeclick-key`
     - Type: RSA
     - Format: .pem
     - **احفظ الملف!**

4. **Network settings:**
   - Create security group
   - Allow SSH (22) from 0.0.0.0/0
   - Allow HTTP (80) from 0.0.0.0/0
   - Add rule: Custom TCP (3001) from 0.0.0.0/0

5. **Storage**: 8 GB gp2 (Free tier)

6. **انقر "Launch instance"**

### **2. الاتصال بالخادم:**

1. **انتظر حتى يصبح Instance State = "running"**

2. **احصل على Public IP من AWS Console**

3. **اتصل عبر SSH:**
```bash
ssh -i bebeclick-key.pem ubuntu@YOUR-PUBLIC-IP
```

### **3. إعداد الخادم:**

```bash
# تحديث النظام
sudo apt update -y

# تثبيت Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2 و Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# إنشاء مجلد التطبيق
sudo mkdir -p /opt/bebeclick
sudo chown ubuntu:ubuntu /opt/bebeclick
```

### **4. رفع التطبيق:**

**من جهازك المحلي:**
```bash
# رفع الملف
scp -i bebeclick-key.pem bebeclick-aws-production.zip ubuntu@YOUR-PUBLIC-IP:~/

# أو إذا كان tar.gz
scp -i bebeclick-key.pem bebeclick-aws-production.tar.gz ubuntu@YOUR-PUBLIC-IP:~/
```

**على الخادم:**
```bash
# استخراج الملفات
unzip bebeclick-aws-production.zip
# أو
tar -xzf bebeclick-aws-production.tar.gz

# نقل الملفات
sudo mv bebeclick-aws-production/* /opt/bebeclick/
sudo chown -R ubuntu:ubuntu /opt/bebeclick

# الانتقال لمجلد التطبيق
cd /opt/bebeclick
```

### **5. تشغيل التطبيق:**

```bash
# تشغيل مع PM2
pm2 start server.js --name bebeclick-app

# حفظ إعدادات PM2
pm2 save

# تشغيل تلقائي عند إعادة التشغيل
pm2 startup
```

### **6. إعداد Nginx (اختياري):**

```bash
# إنشاء إعدادات Nginx
sudo tee /etc/nginx/sites-available/bebeclick << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/bebeclick /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# إعادة تشغيل Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📋 **الطريقة 2: استخدام AWS CLI (إذا عمل)**

### **1. اختبار AWS CLI:**
```powershell
# أعد تشغيل PowerShell كمدير أولاً
aws --version
aws sts get-caller-identity
```

### **2. إذا عمل AWS CLI، شغل:**
```powershell
.\deploy-simple.ps1
```

---

## 🔍 **اختبار التطبيق:**

### **URLs للاختبار:**
- **التطبيق الرئيسي**: `http://YOUR-PUBLIC-IP`
- **Health Check**: `http://YOUR-PUBLIC-IP/health`
- **المنفذ المباشر**: `http://YOUR-PUBLIC-IP:3001`

### **أوامر المراقبة:**
```bash
# حالة التطبيق
pm2 status

# السجلات
pm2 logs bebeclick-app

# إعادة التشغيل
pm2 restart bebeclick-app

# استخدام الذاكرة
free -h

# استخدام المعالج
htop
```

---

## 💰 **التكلفة:**

- **EC2 t2.micro**: مجاني لسنة كاملة (Free Tier)
- **8GB Storage**: مجاني (Free Tier)
- **Data Transfer**: 1GB مجاني شهرياً

---

## 🚨 **استكشاف الأخطاء:**

### **إذا لم يعمل التطبيق:**
```bash
# تحقق من السجلات
pm2 logs bebeclick-app

# تحقق من المنفذ
netstat -tulpn | grep 3001

# تحقق من الملفات
ls -la /opt/bebeclick/
```

### **إذا لم يعمل Nginx:**
```bash
# تحقق من حالة Nginx
sudo systemctl status nginx

# تحقق من إعدادات Nginx
sudo nginx -t

# سجلات Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🎉 **النتيجة المتوقعة:**

بعد اتباع هذه الخطوات، ستحصل على:

- ✅ **خادم AWS EC2** يعمل مجاناً
- ✅ **تطبيق BebeClick** متاح على الإنترنت
- ✅ **أداء محسن** مع PM2 و Nginx
- ✅ **مراقبة شاملة** للنظام

**🌐 تطبيقك سيكون متاح على: `http://YOUR-PUBLIC-IP`**
