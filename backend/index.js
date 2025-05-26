import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Import database connection
import db from "./config/database.js";

// Import routing and models
import CatatanRoute from "./Route/CatatanRoute.js";
import UserRoute from "./Route/Userroute.js";
import "./models/Usermodel.js";
import "./models/CatatanModel.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Define allowed origins - PERBAIKAN CORS
const allowedOrigins = [
  'https://tugas-7-dion-dot-g-01-02.uc.r.appspot.com',  // Original config
  'https://tugas-7-dion-913201672104.appspot.com',      // Alternative App Engine format
  'https://tugas-7-dion.appspot.com',                   // Simplified App Engine format
  'http://localhost:3000',                              // Local development
  'http://localhost:5000',                              // Alternative local port
  'http://127.0.0.1:3000',                             // Alternative localhost
];

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS Request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) {
      console.log('No origin - allowing request');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      return callback(null, true);
    }
    
    // For development: allow any localhost or 127.0.0.1
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('Local development origin allowed:', origin);
      return callback(null, true);
    }
    
    // For App Engine: allow any appspot.com subdomain containing your project
    if (origin.includes('appspot.com') && (origin.includes('tugas-7-dion') || origin.includes('g-01-02'))) {
      console.log('App Engine origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('Origin rejected:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log('Preflight request received for:', req.path);
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

app.use(cookieParser());
app.use(express.json());

app.use(CatatanRoute);
app.use(UserRoute);

app.use(express.static(path.join(projectRoot, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "frontend", "index.html"));
});

// Health check endpoint - Enhanced
app.get("/health", async (req, res) => {
  try {
    await db.authenticate();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString(),
      cors: 'Configured',
      origins: allowedOrigins
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// CORS debug endpoint
app.get("/cors-test", (req, res) => {
  res.json({
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    allowedOrigins: allowedOrigins
  });
});

// Database synchronization function
const syncDatabase = async () => {
  try {
    console.log('🔄 Starting database synchronization...');
    
    // Import models to ensure they are registered
    const User = (await import('./models/Usermodel.js')).default;
    const Catatan = (await import('./models/CatatanModel.js')).default;
    
    // Define associations
    User.hasMany(Catatan, {
      foreignKey: 'userId',
      as: 'catatans',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    Catatan.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Simple sync without alter to avoid constraint conflicts
    await db.sync({ 
      force: false,
      alter: false  // Changed to false to avoid constraint conflicts
    });
    
    console.log('✅ Database synchronized successfully');
    console.log('📊 All models have been synchronized with the database');
    
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    console.log('💡 If this is the first run, please use setup-db.js first');
    throw error;
  }
};

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await db.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Synchronize database
    await syncDatabase();
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server up and running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
      console.log(`🔧 CORS test available at: http://localhost:${PORT}/cors-test`);
      console.log('✅ CORS configured for origins:', allowedOrigins);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();