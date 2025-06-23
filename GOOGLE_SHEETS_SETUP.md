# دليل ربط Google Sheets مع نظام المنتجات

## 📋 إعداد Google Sheets

### 1. إنشاء Google Sheet جديد

1. اذهب إلى [Google Sheets](https://sheets.google.com)
2. أنشئ جدول بيانات جديد
3. أعد تسمية الورقة إلى "Products"

### 2. تنسيق الجدول

أضف الأعمدة التالية في الصف الأول:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| ID | اسم المنتج | الفئة | الطول | العرض | الارتفاع | الوزن | رمز المنتج | السعر |

### 3. مثال على البيانات

```
1 | عربة أطفال Premium | عربات | 85 | 60 | 105 | 12.5 | STR-001 | 25000
2 | كرسي سيارة للأطفال | كراسي السيارة | 45 | 45 | 65 | 8.2 | CAR-001 | 18000
3 | سرير أطفال قابل للطي | أسرة | 120 | 60 | 85 | 15.0 | BED-001 | 22000
```

## 🔑 إعداد Google Sheets API

### 1. إنشاء مشروع في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل Google Sheets API

### 2. إنشاء مفتاح API

1. اذهب إلى "APIs & Services" > "Credentials"
2. انقر على "Create Credentials" > "API Key"
3. انسخ المفتاح

### 3. تحديث الكود

في ملف `src/lib/productService.js`:

```javascript
constructor() {
  this.SHEET_ID = 'معرف_الجدول_هنا'; // من رابط Google Sheets
  this.API_KEY = 'مفتاح_API_هنا';
}
```

### 4. الحصول على معرف الجدول

من رابط Google Sheets:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

معرف الجدول هو: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## 🔄 تفعيل الربط

### 1. تحديث productService.js

غيّر في دالة `searchProducts`:

```javascript
async searchProducts(query) {
  // احذف هذا السطر:
  // const filtered = this.mockProducts.filter...
  
  // أضف هذا السطر:
  const products = await this.fetchFromGoogleSheets(query);
  return products;
}
```

### 2. جعل الجدول عام

1. في Google Sheets، انقر على "Share"
2. اختر "Anyone with the link can view"
3. انسخ الرابط

## 📊 إدارة البيانات

### إضافة منتج جديد:
1. افتح Google Sheets
2. أضف صف جديد بالبيانات المطلوبة
3. احفظ الجدول

### تحديث منتج:
1. عدّل البيانات في Google Sheets
2. احفظ التغييرات
3. ستظهر التحديثات فوراً في التطبيق

## 🔧 استكشاف الأخطاء

### المشاكل الشائعة:

1. **لا تظهر المنتجات:**
   - تأكد من أن الجدول عام
   - تحقق من معرف الجدول
   - تأكد من صحة مفتاح API

2. **خطأ في API:**
   - تأكد من تفعيل Google Sheets API
   - تحقق من صحة مفتاح API

3. **بيانات خاطئة:**
   - تأكد من تنسيق الأعمدة
   - تحقق من أن الأرقام في الأعمدة الصحيحة

## 📱 الميزات المتقدمة

### البحث المتقدم:
- البحث بالاسم
- البحث بالفئة  
- البحث برمز المنتج

### التصفية:
- حسب الفئة
- حسب النطاق السعري
- حسب الحجم

## 🚀 التطوير المستقبلي

### ميزات مخططة:
- [ ] إضافة منتجات من التطبيق
- [ ] تحديث المنتجات
- [ ] حذف المنتجات
- [ ] تصدير التقارير
- [ ] إحصائيات الاستخدام

## 📞 الدعم

للمساعدة في الإعداد أو حل المشاكل، تواصل مع فريق التطوير.
