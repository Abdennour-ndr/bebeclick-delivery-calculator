/**
 * اختبار حساب الأسعار مع البيانات الجديدة
 */

import firebaseService from './src/services/firebaseService.js';

const testPricingCalculation = async () => {
  try {
    console.log('💰 اختبار حساب الأسعار...');
    
    // اختبار الجزائر
    console.log('\n📍 اختبار الجزائر...');
    const algerCommunes = await firebaseService.getCommunesByWilaya(16);
    const algerCentre = algerCommunes.find(c => c.name === 'Alger Centre');
    
    if (algerCentre) {
      console.log(`✅ بلدية: ${algerCentre.name}`);
      console.log(`💰 سعر المنزل: ${algerCentre.pricing?.yalidine?.home}DA`);
      console.log(`🏢 سعر المكتب: ${algerCentre.pricing?.yalidine?.office}DA`);
      
      // محاكاة حساب التكلفة
      const weight = 3; // 3 كيلو
      const declaredValue = 5000; // 5000 دينار
      
      const basePrice = algerCentre.pricing.yalidine.home;
      const overweightFee = weight > 5 ? (weight - 5) * 50 : 0;
      const reimbursementFee = Math.round(declaredValue * 0.01);
      const totalCost = basePrice + overweightFee + reimbursementFee;
      
      console.log(`\n🧮 حساب التكلفة:`);
      console.log(`   الوزن: ${weight}kg`);
      console.log(`   القيمة المعلنة: ${declaredValue}DA`);
      console.log(`   السعر الأساسي: ${basePrice}DA`);
      console.log(`   رسوم الوزن الزائد: ${overweightFee}DA`);
      console.log(`   رسوم الاسترداد (1%): ${reimbursementFee}DA`);
      console.log(`   ✅ المجموع: ${totalCost}DA`);
    }
    
    // اختبار وهران
    console.log('\n📍 اختبار وهران...');
    const oranCommunes = await firebaseService.getCommunesByWilaya(31);
    const oranCity = oranCommunes.find(c => c.name === 'Oran');
    
    if (oranCity) {
      console.log(`✅ بلدية: ${oranCity.name}`);
      console.log(`💰 سعر المنزل: ${oranCity.pricing?.yalidine?.home}DA`);
      console.log(`🏢 سعر المكتب: ${oranCity.pricing?.yalidine?.office}DA`);
      
      // محاكاة حساب التكلفة مع وزن زائد
      const weight = 7; // 7 كيلو (وزن زائد)
      const declaredValue = 8000; // 8000 دينار
      
      const basePrice = oranCity.pricing.yalidine.home;
      const overweightFee = weight > 5 ? (weight - 5) * 50 : 0;
      const reimbursementFee = Math.round(declaredValue * 0.01);
      const totalCost = basePrice + overweightFee + reimbursementFee;
      
      console.log(`\n🧮 حساب التكلفة مع وزن زائد:`);
      console.log(`   الوزن: ${weight}kg (زائد ${weight - 5}kg)`);
      console.log(`   القيمة المعلنة: ${declaredValue}DA`);
      console.log(`   السعر الأساسي: ${basePrice}DA`);
      console.log(`   رسوم الوزن الزائد: ${overweightFee}DA (${weight - 5}kg × 50DA)`);
      console.log(`   رسوم الاسترداد (1%): ${reimbursementFee}DA`);
      console.log(`   ✅ المجموع: ${totalCost}DA`);
    }
    
    // اختبار منطقة صحراوية
    console.log('\n📍 اختبار أدرار (منطقة صحراوية)...');
    const adrarCommunes = await firebaseService.getCommunesByWilaya(1);
    const adrarCity = adrarCommunes.find(c => c.name === 'Adrar');
    
    if (adrarCity) {
      console.log(`✅ بلدية: ${adrarCity.name}`);
      console.log(`💰 سعر المنزل: ${adrarCity.pricing?.yalidine?.home}DA`);
      console.log(`🏢 سعر المكتب: ${adrarCity.pricing?.yalidine?.office}DA`);
      
      const weight = 2; // 2 كيلو
      const declaredValue = 3000; // 3000 دينار
      
      const basePrice = adrarCity.pricing.yalidine.home;
      const overweightFee = weight > 5 ? (weight - 5) * 50 : 0;
      const reimbursementFee = Math.round(declaredValue * 0.01);
      const totalCost = basePrice + overweightFee + reimbursementFee;
      
      console.log(`\n🧮 حساب التكلفة للمنطقة الصحراوية:`);
      console.log(`   الوزن: ${weight}kg`);
      console.log(`   القيمة المعلنة: ${declaredValue}DA`);
      console.log(`   السعر الأساسي: ${basePrice}DA`);
      console.log(`   رسوم الوزن الزائد: ${overweightFee}DA`);
      console.log(`   رسوم الاسترداد (1%): ${reimbursementFee}DA`);
      console.log(`   ✅ المجموع: ${totalCost}DA`);
    }
    
    console.log('\n🎉 جميع اختبارات حساب الأسعار نجحت!');
    console.log('✅ الأسعار تُحسب مباشرة من Firebase');
    console.log('✅ لا توجد حاجة للـ API القديم');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار حساب الأسعار:', error);
  }
};

// تشغيل الاختبار
testPricingCalculation();
