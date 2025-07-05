/**
 * خدمة Firebase لـ BebeClick Delivery Calculator
 * تستخدم Firebase Firestore كقاعدة بيانات
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

class FirebaseService {
  constructor() {
    this.collections = {
      locations: 'locations',
      products: 'products',
      deliveryPricing: 'delivery_pricing',
      orders: 'orders',
      users: 'users'
    };
    
    console.log('🔥 Firebase Service مُهيأ');
  }

  /**
   * الولايات والبلديات
   */
  
  // الحصول على جميع الولايات من delivery_pricing
  async getWilayas() {
    try {
      console.log('🗺️ جلب الولايات من delivery_pricing...');

      const q = query(
        collection(db, this.collections.deliveryPricing),
        where('service', '==', 'yalidine'),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const wilayaMap = new Map(); // لتجنب التكرار

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const wilayaKey = data.wilayaCode;

        if (!wilayaMap.has(wilayaKey)) {
          wilayaMap.set(wilayaKey, {
            id: `wilaya_${data.wilayaCode}`,
            code: data.wilayaCode.toString().padStart(2, '0'),
            name: data.wilayaName,
            zone: data.zone,
            wilayaCode: data.wilayaCode,
            type: 'wilaya',
            is_deliverable: true
          });
        }
      });

      // تحويل Map إلى Array وترتيب حسب الكود
      const wilayas = Array.from(wilayaMap.values()).sort((a, b) => a.wilayaCode - b.wilayaCode);

      console.log(`✅ تم جلب ${wilayas.length} ولاية من delivery_pricing`);
      return wilayas;

    } catch (error) {
      console.error('❌ خطأ في جلب الولايات:', error);
      throw error;
    }
  }

  // الحصول على بلديات ولاية معينة من delivery_pricing
  async getCommunesByWilaya(wilayaCode) {
    try {
      console.log(`🏘️ جلب بلديات ولاية ${wilayaCode} من delivery_pricing...`);

      // تحويل wilayaCode إلى رقم للتأكد
      const numericWilayaCode = parseInt(wilayaCode);
      console.log(`🔍 البحث عن البلديات بـ wilayaCode: ${numericWilayaCode} (نوع: ${typeof numericWilayaCode})`);

      const q = query(
        collection(db, this.collections.deliveryPricing),
        where('wilayaCode', '==', numericWilayaCode),
        where('service', '==', 'yalidine'),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const communes = [];
      const communeMap = new Map(); // لتجنب التكرار

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const communeKey = data.commune;

        if (!communeMap.has(communeKey)) {
          console.log(`📍 بلدية موجودة: ${data.commune}, wilayaCode: ${data.wilayaCode}, أسعار: ${data.pricing.home}دج (منزل), ${data.pricing.office}دج (مكتب)`);

          communeMap.set(communeKey, {
            id: doc.id,
            name: data.commune,
            wilayaCode: data.wilayaCode,
            wilayaName: data.wilayaName,
            zone: data.zone,
            pricing: data.pricing,
            status: data.status,
            metadata: data.metadata
          });
        }
      });

      // تحويل Map إلى Array وترتيب حسب الاسم
      communes.push(...Array.from(communeMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

      console.log(`✅ تم جلب ${communes.length} بلدية للولاية ${numericWilayaCode} من delivery_pricing`);

      return communes;

    } catch (error) {
      console.error('❌ خطأ في جلب البلديات:', error);
      console.error('تفاصيل الخطأ:', error.message);
      throw error;
    }
  }

  // التحقق من البيانات الموجودة
  async checkDataStructure() {
    try {
      console.log('🔍 فحص هيكل البيانات في Firebase...');

      // فحص الولايات
      const wilayasQuery = query(
        collection(db, this.collections.locations),
        where('type', '==', 'wilaya'),
        limit(5)
      );

      const wilayasSnapshot = await getDocs(wilayasQuery);
      console.log(`📊 عدد الولايات الموجودة: ${wilayasSnapshot.size}`);

      wilayasSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📍 ولاية: ${data.name} (كود: ${data.code})`);
      });

      // فحص البلديات
      const communesQuery = query(
        collection(db, this.collections.locations),
        where('type', '==', 'commune'),
        limit(10)
      );

      const communesSnapshot = await getDocs(communesQuery);
      console.log(`📊 عدد البلديات الموجودة: ${communesSnapshot.size}`);

      communesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`🏘️ بلدية: ${data.name} (ولاية: ${data.hierarchy?.wilayaCode})`);
      });

      return {
        wilayasCount: wilayasSnapshot.size,
        communesCount: communesSnapshot.size
      };

    } catch (error) {
      console.error('❌ خطأ في فحص البيانات:', error);
      throw error;
    }
  }

  // إضافة ولاية
  async addWilaya(wilayaData) {
    try {
      console.log(`➕ إضافة ولاية: ${wilayaData.name}`);

      const docData = {
        ...wilayaData,
        type: 'wilaya',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collections.locations), docData);

      console.log(`✅ تم إضافة الولاية بـ ID: ${docRef.id}`);
      return { id: docRef.id, ...docData };

    } catch (error) {
      console.error('❌ خطأ في إضافة الولاية:', error);
      throw error;
    }
  }

  // تحديث ولاية
  async updateWilaya(wilayaId, updateData) {
    try {
      console.log(`🔄 تحديث ولاية: ${updateData.name || wilayaId}`);

      const docData = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, this.collections.locations, wilayaId);
      await updateDoc(docRef, docData);

      console.log(`✅ تم تحديث الولاية بـ ID: ${wilayaId}`);
      return { id: wilayaId, ...docData };

    } catch (error) {
      console.error('❌ خطأ في تحديث الولاية:', error);
      throw error;
    }
  }

  // إضافة بلدية
  async addCommune(wilayaCode, communeData) {
    try {
      console.log(`➕ إضافة بلدية: ${communeData.name}`);
      
      const docData = {
        ...communeData,
        type: 'commune',
        hierarchy: {
          wilayaCode: wilayaCode,
          wilayaName: communeData.wilayaName || 'غير محدد'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.collections.locations), docData);
      
      console.log(`✅ تم إضافة البلدية بـ ID: ${docRef.id}`);
      return { id: docRef.id, ...docData };
      
    } catch (error) {
      console.error('❌ خطأ في إضافة البلدية:', error);
      throw error;
    }
  }

  // تحديث بلدية
  async updateCommune(communeId, updateData) {
    try {
      console.log(`🔄 تحديث بلدية: ${updateData.name || communeId}`);

      const docData = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, this.collections.locations, communeId);
      await updateDoc(docRef, docData);

      console.log(`✅ تم تحديث البلدية بـ ID: ${communeId}`);
      return { id: communeId, ...docData };

    } catch (error) {
      console.error('❌ خطأ في تحديث البلدية:', error);
      throw error;
    }
  }

  /**
   * المنتجات
   */
  
  // البحث في المنتجات
  async searchProducts(searchTerm = '', limitCount = 20) {
    try {
      console.log(`🔍 البحث في المنتجات: "${searchTerm}"`);

      // جلب جميع المنتجات أولاً (بدون فلتر status)
      const q = query(
        collection(db, this.collections.products),
        limit(limitCount * 2) // جلب عدد أكبر للفلترة المحلية
      );

      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // تجاهل المنتجات المحذوفة إذا كان لديها status
        if (data.status === 'deleted') {
          return;
        }

        // فلترة محلية للبحث
        if (!searchTerm ||
            data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.category?.toLowerCase().includes(searchTerm.toLowerCase())) {
          products.push({
            id: doc.id,
            ...data
          });
        }
      });

      // ترتيب النتائج حسب الصلة
      const sortedProducts = products.sort((a, b) => {
        if (!searchTerm) return 0;

        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();

        // إعطاء أولوية للمطابقة في بداية الاسم
        const aStartsWith = aName.startsWith(searchLower);
        const bStartsWith = bName.startsWith(searchLower);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return aName.localeCompare(bName);
      });

      const finalResults = sortedProducts.slice(0, limitCount);
      console.log(`✅ تم العثور على ${finalResults.length} منتج من أصل ${querySnapshot.size}`);

      return finalResults;

    } catch (error) {
      console.error('❌ خطأ في البحث عن المنتجات:', error);
      throw error;
    }
  }

  // الحصول على جميع المنتجات
  async getProducts() {
    try {
      console.log('📦 جلب جميع المنتجات من Firebase...');

      const q = query(
        collection(db, this.collections.products),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // تجاهل المنتجات المحذوفة إذا كان لديها status
        if (data.status !== 'deleted') {
          products.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log(`✅ تم جلب ${products.length} منتج من Firebase`);
      return products;

    } catch (error) {
      console.error('❌ خطأ في جلب المنتجات:', error);
      throw error;
    }
  }

  // إضافة منتج
  async addProduct(productData) {
    try {
      console.log(`💾 Firebase: إضافة منتج: ${productData.name}`);
      console.log('📦 Firebase: البيانات المستلمة:', JSON.stringify(productData, null, 2));

      // التحقق من وجود القياسات
      if (productData.dimensions) {
        console.log('📏 Firebase: القياسات موجودة:');
        console.log('  - الطول:', productData.dimensions.length);
        console.log('  - العرض:', productData.dimensions.width);
        console.log('  - الارتفاع:', productData.dimensions.height);
      } else {
        console.log('⚠️ Firebase: القياسات مفقودة!');
      }

      const docData = {
        ...productData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('📋 Firebase: البيانات النهائية للحفظ:', JSON.stringify(docData, null, 2));

      const docRef = await addDoc(collection(db, this.collections.products), docData);

      console.log(`✅ Firebase: تم إضافة المنتج بـ ID: ${docRef.id}`);

      const savedData = { id: docRef.id, ...docData };
      console.log('💾 Firebase: البيانات المحفوظة النهائية:', JSON.stringify(savedData, null, 2));

      return savedData;

    } catch (error) {
      console.error('❌ خطأ في إضافة المنتج:', error);
      throw error;
    }
  }

  // حفظ منتج (للتوافق مع الكود الموجود)
  async saveProduct(productData) {
    return this.addProduct(productData);
  }

  // تحديث منتج
  async updateProduct(productId, productData) {
    try {
      console.log(`📝 تحديث المنتج: ${productId}`);

      const docData = {
        ...productData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, this.collections.products, productId), docData);

      console.log(`✅ تم تحديث المنتج: ${productId}`);
      return { id: productId, ...docData };

    } catch (error) {
      console.error('❌ خطأ في تحديث المنتج:', error);
      throw error;
    }
  }

  // حذف منتج
  async deleteProduct(productId) {
    try {
      console.log(`🗑️ حذف المنتج: ${productId}`);

      await deleteDoc(doc(db, this.collections.products, productId));

      console.log(`✅ تم حذف المنتج: ${productId}`);
      return true;

    } catch (error) {
      console.error('❌ خطأ في حذف المنتج:', error);
      throw error;
    }
  }

  /**
   * أسعار التوصيل
   */
  
  // الحصول على أسعار خدمة معينة
  async getServicePricing(service) {
    try {
      console.log(`💰 جلب أسعار خدمة: ${service}`);
      
      const q = query(
        collection(db, this.collections.deliveryPricing),
        where('service', '==', service),
        where('status', '==', 'active'),
        orderBy('wilayaCode', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const pricing = [];
      
      querySnapshot.forEach((doc) => {
        pricing.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ تم جلب ${pricing.length} سعر`);
      return pricing;
      
    } catch (error) {
      console.error('❌ خطأ في جلب الأسعار:', error);
      throw error;
    }
  }

  // حفظ سعر توصيل
  async savePricing(pricingData) {
    try {
      console.log(`💾 حفظ سعر توصيل`);
      
      const docData = {
        ...pricingData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.collections.deliveryPricing), docData);
      
      console.log(`✅ تم حفظ السعر بـ ID: ${docRef.id}`);
      return { id: docRef.id, ...docData };
      
    } catch (error) {
      console.error('❌ خطأ في حفظ السعر:', error);
      throw error;
    }
  }

  // البحث عن أسعار التوصيل حسب الولاية
  async getDeliveryPricesByWilaya(wilayaCode, service = null) {
    try {
      console.log(`🔍 البحث عن أسعار التوصيل للولاية: ${wilayaCode}`);

      let q;
      if (service) {
        q = query(
          collection(db, this.collections.deliveryPricing),
          where('wilayaCode', '==', parseInt(wilayaCode)),
          where('service', '==', service),
          where('status', '==', 'active'),
          orderBy('commune', 'asc')
        );
      } else {
        q = query(
          collection(db, this.collections.deliveryPricing),
          where('wilayaCode', '==', parseInt(wilayaCode)),
          where('status', '==', 'active'),
          orderBy('service', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      const prices = [];

      querySnapshot.forEach((doc) => {
        prices.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ تم العثور على ${prices.length} سعر للولاية ${wilayaCode}`);
      return prices;

    } catch (error) {
      console.error('❌ خطأ في البحث عن أسعار الولاية:', error);
      throw error;
    }
  }

  // البحث عن أسعار التوصيل حسب البلدية
  async getDeliveryPricesByCommune(wilayaCode, communeName, service = null) {
    try {
      console.log(`🔍 البحث عن أسعار التوصيل للبلدية: ${communeName} في الولاية ${wilayaCode}`);

      let q;
      if (service) {
        q = query(
          collection(db, this.collections.deliveryPricing),
          where('wilayaCode', '==', parseInt(wilayaCode)),
          where('commune', '==', communeName),
          where('service', '==', service),
          where('status', '==', 'active')
        );
      } else {
        q = query(
          collection(db, this.collections.deliveryPricing),
          where('wilayaCode', '==', parseInt(wilayaCode)),
          where('commune', '==', communeName),
          where('status', '==', 'active'),
          orderBy('service', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      const prices = [];

      querySnapshot.forEach((doc) => {
        prices.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ تم العثور على ${prices.length} سعر للبلدية ${communeName}`);
      return prices;

    } catch (error) {
      console.error('❌ خطأ في البحث عن أسعار البلدية:', error);
      throw error;
    }
  }

  // البحث عن سعر توصيل محدد
  async getDeliveryPrice(destination, deliveryType = 'home', weight = 0, dimensions = {}, declaredValue = 0) {
    try {
      console.log(`🔍 البحث عن سعر توصيل: ${destination}`);

      // منطق البحث المبسط - يمكن تحسينه لاحقاً
      const q = query(
        collection(db, this.collections.deliveryPricing),
        where('status', '==', 'active'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);

      // البحث المحلي في النتائج
      let bestMatch = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.commune && destination.toLowerCase().includes(data.commune.toLowerCase())) {
          bestMatch = {
            id: doc.id,
            ...data,
            dataSource: 'firebase'
          };
        }
      });

      if (bestMatch) {
        console.log('✅ تم العثور على سعر مطابق');
        return bestMatch;
      }
      
      console.log('⚠️ لم يتم العثور على سعر مطابق');
      return null;
      
    } catch (error) {
      console.error('❌ خطأ في البحث عن السعر:', error);
      return null;
    }
  }

  /**
   * عمليات مجمعة
   */
  
  // إدراج بيانات مجمعة
  async bulkInsert(collectionName, dataArray) {
    try {
      console.log(`📦 إدراج مجمع في ${collectionName}: ${dataArray.length} عنصر`);
      
      const batch = writeBatch(db);
      const results = [];
      
      dataArray.forEach((data) => {
        const docRef = doc(collection(db, collectionName));
        const docData = {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        batch.set(docRef, docData);
        results.push({ id: docRef.id, ...docData });
      });
      
      await batch.commit();
      
      console.log(`✅ تم إدراج ${results.length} عنصر بنجاح`);
      return results;
      
    } catch (error) {
      console.error('❌ خطأ في الإدراج المجمع:', error);
      throw error;
    }
  }

  /**
   * إحصائيات
   */
  
  async getStats() {
    try {
      console.log('📊 جلب الإحصائيات...');
      
      const stats = {
        locations: 0,
        products: 0,
        deliveryPricing: 0,
        orders: 0
      };
      
      // عد المواقع
      const locationsSnapshot = await getDocs(collection(db, this.collections.locations));
      stats.locations = locationsSnapshot.size;
      
      // عد المنتجات
      const productsSnapshot = await getDocs(collection(db, this.collections.products));
      stats.products = productsSnapshot.size;
      
      // عد أسعار التوصيل
      const pricingSnapshot = await getDocs(collection(db, this.collections.deliveryPricing));
      stats.deliveryPricing = pricingSnapshot.size;
      
      console.log('✅ تم جلب الإحصائيات');
      return stats;
      
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
      throw error;
    }
  }

  // جلب جميع الأسعار
  async getAllPricing() {
    try {
      console.log('🔍 جلب جميع الأسعار');

      const pricingRef = collection(db, this.collections.deliveryPricing);
      const snapshot = await getDocs(pricingRef);
      const pricing = [];

      snapshot.forEach((doc) => {
        pricing.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ تم جلب ${pricing.length} سعر`);
      return pricing;

    } catch (error) {
      console.error('❌ خطأ في جلب جميع الأسعار:', error);
      throw error;
    }
  }

  // تحديث سعر موجود
  async updatePricing(pricingId, updatedData) {
    try {
      const pricingRef = doc(db, this.collections.deliveryPricing, pricingId);
      await updateDoc(pricingRef, updatedData);

      return { success: true, id: pricingId };

    } catch (error) {
      console.error('❌ خطأ في تحديث السعر:', error);
      throw error;
    }
  }

  /**
   * إدارة المنتجات
   */

  // إضافة منتج جديد
  async addProduct(productData) {
    try {
      console.log('➕ إضافة منتج جديد:', productData.name);

      const docRef = await addDoc(collection(db, this.collections.products), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ تم إضافة المنتج بنجاح:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('❌ خطأ في إضافة المنتج:', error);
      throw error;
    }
  }

  // تحديث منتج
  async updateProduct(productId, productData) {
    try {
      console.log('✏️ تحديث المنتج:', productId);

      const productRef = doc(db, this.collections.products, productId);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: serverTimestamp()
      });

      console.log('✅ تم تحديث المنتج بنجاح');

    } catch (error) {
      console.error('❌ خطأ في تحديث المنتج:', error);
      throw error;
    }
  }

  // حذف منتج
  async deleteProduct(productId) {
    try {
      console.log('🗑️ حذف المنتج:', productId);

      const productRef = doc(db, this.collections.products, productId);
      await deleteDoc(productRef);

      console.log('✅ تم حذف المنتج بنجاح');

    } catch (error) {
      console.error('❌ خطأ في حذف المنتج:', error);
      throw error;
    }
  }

  // البحث عن منتج بـ SKU
  async getProductBySku(sku) {
    try {
      console.log('🔍 البحث عن منتج بـ SKU:', sku);

      const q = query(
        collection(db, this.collections.products),
        where('sku', '==', sku),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };

    } catch (error) {
      console.error('❌ خطأ في البحث عن المنتج:', error);
      throw error;
    }
  }

  /**
   * اختبار الاتصال
   */

  async testConnection() {
    try {
      console.log('🧪 اختبار اتصال Firebase...');
      
      // محاولة قراءة بسيطة
      const testQuery = query(collection(db, 'test'), limit(1));
      await getDocs(testQuery);
      
      console.log('✅ اتصال Firebase يعمل بشكل مثالي');
      return {
        success: true,
        message: 'Firebase متصل ويعمل',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ خطأ في اختبار Firebase:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// إنشاء instance واحد
const firebaseService = new FirebaseService();

export default firebaseService;
