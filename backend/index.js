import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Import database connection
import db from "./config/database.js";

// Import routing dan model
import CatatanRoute from "./Route/CatatanRoute.js";
import UserRoute from "./Route/Userroute.js";
import "./models/Usermodel.js";
import "./models/CatatanModel.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const allowedOrigin = 'https://tugas-7-dion-dot-g-01-02.uc.r.appspot.com';

// CORS configuration
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

app.use(CatatanRoute);
app.use(UserRoute);

app.use(express.static(path.join(projectRoot, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "frontend", "index.html"));
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await db.authenticate();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
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
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();