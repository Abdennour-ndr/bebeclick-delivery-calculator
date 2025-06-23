#!/bin/bash

# BebeClick Delivery Calculator - Deploy Script
echo "🚀 نشر تطبيق BebeClick Delivery Calculator على Fly.io"
echo "=================================================="

# التحقق من وجود flyctl
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl غير مثبت. يرجى تثبيته أولاً:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# التحقق من تسجيل الدخول
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ يرجى تسجيل الدخول أولاً:"
    echo "flyctl auth login"
    exit 1
fi

echo "✅ flyctl مثبت ومسجل الدخول"

# بناء التطبيق
echo "📦 بناء التطبيق..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ فشل في بناء التطبيق"
    exit 1
fi

echo "✅ تم بناء التطبيق بنجاح"

# التحقق من وجود التطبيق
if ! flyctl apps list | grep -q "calc-bebeclick"; then
    echo "📱 إنشاء تطبيق جديد..."
    flyctl apps create calc-bebeclick
    
    if [ $? -ne 0 ]; then
        echo "❌ فشل في إنشاء التطبيق"
        exit 1
    fi
    
    echo "✅ تم إنشاء التطبيق calc-bebeclick"
else
    echo "✅ التطبيق calc-bebeclick موجود"
fi

# نشر التطبيق
echo "🚀 نشر التطبيق..."
flyctl deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 تم النشر بنجاح!"
    echo "🌐 الرابط: https://calc-bebeclick.fly.dev"
    echo ""
    echo "📊 لعرض حالة التطبيق:"
    echo "flyctl status"
    echo ""
    echo "📋 لعرض اللوجز:"
    echo "flyctl logs"
    echo ""
    echo "🌍 لفتح التطبيق:"
    echo "flyctl open"
else
    echo "❌ فشل في النشر"
    echo "📋 تحقق من اللوجز:"
    echo "flyctl logs"
    exit 1
fi
