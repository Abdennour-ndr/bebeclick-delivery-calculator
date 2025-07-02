/**
 * Serveur MongoDB Atlas pour BebeClick
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Connexion MongoDB Atlas
const connectMongoDB = async () => {
  try {
    console.log('🔗 Connexion à MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas connecté avec succès!');
    console.log(`📊 Base de données: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB Atlas:', error);
    process.exit(1);
  }
};

// Schémas MongoDB simples
const DeliveryPricingSchema = new mongoose.Schema({
  service: { type: String, required: true },
  wilaya: {
    code: { type: Number, required: true },
    name: { type: String, required: true }
  },
  commune: { type: String, required: true },
  pricing: {
    home: { type: Number, required: true },
    office: { type: Number, required: true }
  },
  zone: { type: Number, default: 1 },
  status: { type: String, default: 'active' }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: String,
  category: String,
  dimensions: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true }
  },
  pricing: {
    salePrice: Number,
    costPrice: Number
  }
}, { timestamps: true });

const LocationSchema = new mongoose.Schema({
  type: { type: String, enum: ['wilaya', 'commune'], required: true },
  code: { type: Number, required: true },
  name: { type: String, required: true },
  nameAr: String,
  hierarchy: {
    wilayaCode: Number,
    wilayaName: String
  },
  deliveryConfig: {
    pricingZone: { type: Number, default: 1 },
    averageDeliveryTime: { type: Number, default: 3 }
  }
}, { timestamps: true });

// Modèles
const DeliveryPricing = mongoose.model('DeliveryPricing', DeliveryPricingSchema);
const Product = mongoose.model('Product', ProductSchema);
const Location = mongoose.model('Location', LocationSchema);

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'BebeClick MongoDB Atlas API',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name,
      host: mongoose.connection.host
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes API simples
app.get('/api/delivery-pricing', async (req, res) => {
  try {
    const pricing = await DeliveryPricing.find({ status: 'active' }).limit(50);
    res.json({
      success: true,
      data: pricing,
      count: pricing.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/delivery-pricing', async (req, res) => {
  try {
    const pricing = new DeliveryPricing(req.body);
    await pricing.save();
    res.status(201).json({
      success: true,
      data: pricing,
      message: 'Prix ajouté avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().limit(50);
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
      message: 'Produit ajouté avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/locations/wilayas', async (req, res) => {
  try {
    const wilayas = await Location.find({ type: 'wilaya' }).sort({ code: 1 });
    res.json({
      success: true,
      data: wilayas,
      count: wilayas.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/locations/communes/:wilayaCode', async (req, res) => {
  try {
    const communes = await Location.find({ 
      type: 'commune',
      'hierarchy.wilayaCode': parseInt(req.params.wilayaCode)
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: communes,
      wilayaCode: parseInt(req.params.wilayaCode),
      count: communes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/locations/initialize-algeria', async (req, res) => {
  try {
    const algerianWilayas = [
      { code: 1, name: 'Adrar', nameAr: 'أدرار' },
      { code: 2, name: 'Chlef', nameAr: 'الشلف' },
      { code: 3, name: 'Laghouat', nameAr: 'الأغواط' },
      { code: 16, name: 'Alger', nameAr: 'الجزائر' },
      { code: 31, name: 'Oran', nameAr: 'وهران' },
      { code: 25, name: 'Constantine', nameAr: 'قسنطينة' }
      // Ajouter plus de wilayas selon les besoins
    ];

    const results = [];
    for (const wilayaData of algerianWilayas) {
      try {
        const wilaya = await Location.findOneAndUpdate(
          { type: 'wilaya', code: wilayaData.code },
          {
            type: 'wilaya',
            code: wilayaData.code,
            name: wilayaData.name,
            nameAr: wilayaData.nameAr,
            deliveryConfig: {
              pricingZone: 1,
              averageDeliveryTime: 3
            }
          },
          { upsert: true, new: true }
        );
        results.push({ success: true, data: wilaya });
      } catch (error) {
        results.push({ success: false, error: error.message, data: wilayaData });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      success: true,
      data: results,
      summary: {
        total: algerianWilayas.length,
        success: successCount,
        errors: algerianWilayas.length - successCount
      },
      message: `${successCount} wilayas initialisées`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de test de connexion
app.get('/api/test-connection', async (req, res) => {
  try {
    // Test simple de la base de données
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      success: true,
      message: 'Connexion MongoDB Atlas OK',
      database: mongoose.connection.name,
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware d'erreur
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    message: error.message
  });
});

// Route non trouvée
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Démarrer le serveur
const startServer = async () => {
  try {
    await connectMongoDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur MongoDB Atlas démarré`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Base: ${mongoose.connection.name}`);
      console.log(`🔗 Test: http://localhost:${PORT}/api/test-connection`);
    });
    
  } catch (error) {
    console.error('💥 Erreur démarrage:', error);
    process.exit(1);
  }
};

startServer();
