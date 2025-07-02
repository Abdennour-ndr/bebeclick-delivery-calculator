/**
 * Test simple de connexion MongoDB Atlas
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testMongoDB = async () => {
  try {
    console.log('🔗 Test de connexion MongoDB Atlas...');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas connecté avec succès!');
    console.log(`📊 Base de données: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}`);
    console.log(`🔌 État: ${mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);
    
    // Test simple - créer une collection de test
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    // Insérer un document de test
    const testDoc = new Test({
      message: 'Test de connexion BebeClick'
    });
    
    await testDoc.save();
    console.log('✅ Document de test créé:', testDoc._id);
    
    // Lire le document
    const foundDoc = await Test.findById(testDoc._id);
    console.log('✅ Document lu:', foundDoc.message);
    
    // Supprimer le document de test
    await Test.findByIdAndDelete(testDoc._id);
    console.log('✅ Document de test supprimé');
    
    // Lister les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections disponibles:', collections.map(c => c.name));
    
    console.log('🎉 Test MongoDB Atlas réussi!');
    
  } catch (error) {
    console.error('❌ Erreur test MongoDB:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Connexion fermée');
    process.exit(0);
  }
};

testMongoDB();
