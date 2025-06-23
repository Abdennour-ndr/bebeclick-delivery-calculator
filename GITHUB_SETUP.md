# إعداد مستودع GitHub للمشروع

## خطوات إنشاء المستودع

### 1. إنشاء مستودع جديد على GitHub

1. اذهب إلى [GitHub.com](https://github.com)
2. اضغط على "New repository"
3. املأ المعلومات التالية:
   - **Repository name**: `bebeclick-delivery-calculator`
   - **Description**: `Professional delivery cost calculator for BebeClick - React application with multi-service support`
   - **Visibility**: Public أو Private حسب الحاجة
   - **لا تضع** Initialize with README (لأن لدينا ملفات بالفعل)

### 2. ربط المستودع المحلي

```bash
# إضافة remote origin
git remote add origin https://github.com/[USERNAME]/bebeclick-delivery-calculator.git

# رفع الكود
git push -u origin master
```

### 3. معلومات المستودع المقترحة

#### **اسم المستودع:**
```
bebeclick-delivery-calculator
```

#### **الوصف:**
```
Professional delivery cost calculator for BebeClick - React application supporting Zaki, Yalidine, and Jamal Delivery services with Google Sheets integration and WhatsApp messaging
```

#### **المواضيع (Topics):**
```
react, vite, delivery, calculator, algeria, google-sheets, whatsapp, bebeclick, logistics, cost-calculator
```

#### **الرابط المباشر:**
```
https://calc-bebeclick.surge.sh
```

### 4. إعداد GitHub Pages (اختياري)

1. اذهب إلى Settings → Pages
2. اختر Source: GitHub Actions
3. سيتم النشر تلقائياً باستخدام workflow الموجود

### 5. إعداد Secrets للنشر التلقائي

إذا كنت تريد النشر التلقائي على Fly.io:

1. اذهب إلى Settings → Secrets and variables → Actions
2. أضف secret جديد:
   - **Name**: `FLY_API_TOKEN`
   - **Value**: [احصل على التوكن من fly.io dashboard]

### 6. ملفات المشروع الجاهزة

المشروع يحتوي على:

#### **الملفات الأساسية:**
- `README.md` - وثائق المشروع
- `package.json` - تبعيات Node.js
- `vite.config.js` - إعدادات Vite
- `.gitignore` - ملفات مستبعدة من Git

#### **ملفات النشر:**
- `fly.toml` - إعدادات Fly.io
- `netlify.toml` - إعدادات Netlify
- `vercel.json` - إعدادات Vercel
- `Dockerfile` - للنشر بـ Docker

#### **ملفات التوثيق:**
- `DEPLOYMENT.md` - دليل النشر الشامل
- `QUICK_DEPLOY.md` - خطوات النشر السريع
- `MANUAL_DEPLOY.md` - النشر اليدوي
- `PROJECT_INFO.md` - معلومات المشروع

#### **الكود المصدري:**
- `src/` - مجلد الكود الرئيسي
- `src/components/` - مكونات React
- `src/lib/` - المكتبات والخدمات
- `src/config/` - ملفات الإعدادات

### 7. بعد إنشاء المستودع

1. **حدث README.md** بالرابط الصحيح للمستودع
2. **أضف رابط المستودع** في ملف package.json
3. **فعل GitHub Actions** للنشر التلقائي
4. **أضف Contributors** إذا لزم الأمر

### 8. الأوامر الجاهزة للنسخ

```bash
# إعداد Git (إذا لم يكن مُعد)
git config user.name "BebeClick Development Team"
git config user.email "bebeclick.dev@gmail.com"

# إضافة جميع الملفات
git add .

# Commit نهائي
git commit -m "Complete BebeClick Delivery Calculator

- Multi-service delivery cost calculation
- Google Sheets integration
- WhatsApp messaging
- Professional printing
- Responsive design
- Smart cost algorithms
- Production ready on calc-bebeclick.surge.sh"

# إضافة remote (استبدل USERNAME باسم المستخدم الصحيح)
git remote add origin https://github.com/USERNAME/bebeclick-delivery-calculator.git

# رفع الكود
git push -u origin master
```

### 9. معلومات إضافية

#### **حجم المشروع:**
- حوالي 100+ ملف
- مكتبات React حديثة
- تطبيق جاهز للإنتاج

#### **الميزات الرئيسية:**
- حاسبة تكلفة التوصيل
- دعم 3 خدمات توصيل
- تكامل Google Sheets
- رسائل WhatsApp
- طباعة احترافية
- تصميم متجاوب

#### **الروابط المهمة:**
- **الإنتاج**: https://calc-bebeclick.surge.sh
- **التوثيق**: README.md
- **النشر**: DEPLOYMENT.md

---

**ملاحظة**: تأكد من استبدال `[USERNAME]` باسم المستخدم الصحيح على GitHub.
