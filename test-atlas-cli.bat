@echo off
echo 🚀 اختبار Atlas CLI...
echo.

echo 📋 عرض معلومات Atlas CLI:
.\atlas-cli\bin\atlas.exe --version
echo.

echo 🔍 محاولة عرض الـ clusters (قد يطلب تسجيل دخول):
.\atlas-cli\bin\atlas.exe clusters list
echo.

echo ✅ انتهى الاختبار
pause
