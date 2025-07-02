/**
 * إعدادات Firebase لـ BebeClick Delivery Calculator
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// إعدادات Firebase الحقيقية
const firebaseConfig = {
  apiKey: "AIzaSyDzv7w2s--bZMIVdmg0Aog0l3vtmNhJPEI",
  authDomain: "bebeclick-delivery-calculator.firebaseapp.com",
  projectId: "bebeclick-delivery-calculator",
  storageBucket: "bebeclick-delivery-calculator.firebasestorage.app",
  messagingSenderId: "840872804453",
  appId: "1:840872804453:web:d1afbd0fab5dc904e9868c",
  measurementId: "G-YR4D2W3JK0"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة Firestore
export const db = getFirestore(app);

// تهيئة Authentication (للمستقبل)
export const auth = getAuth(app);

// تهيئة Analytics (اختياري)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

// إعدادات التطوير
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase متصل في المتصفح');
} else {
  console.log('🔥 Firebase متصل في Node.js');
}

export default app;
