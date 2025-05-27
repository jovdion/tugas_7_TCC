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

// Define allowed origins
const allowedOrigins = [
  'https://tugas-7-dion-dot-g-01-02.uc.r.appspot.com',  // Your frontend URL
  'https://tugas-7-dion-913201672104.us-central1.run.app', // Your API URL (for self-reference)
  'http://localhost:3000',  // Local development
  'http://localhost:5000',  // Local development alternate
];

// CORS configuration - simplified and more reliable
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400  // Cache preflight for 24 hours
}));

// Remove the custom options handler - let cors middleware handle it
// The custom app.options('*') was causing conflicts

// Middleware for handling cookies and parsing JSON requests
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use(CatatanRoute);
app.use(UserRoute);

// Static files
app.use(express.static(path.join(projectRoot, "frontend")));

// Root route
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
      timestamp: new Date().toISOString(),
      cors: 'Configured',
      origins: allowedOrigins,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: error.message,
    });
  }
});

// CORS test endpoint for debugging
app.get("/cors-test", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.get('Origin'),
    method: req.method,
    headers: req.headers
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.error('CORS Error:', {
      origin: req.get('Origin'),
      method: req.method,
      path: req.path
    });
    return res.status(403).json({
      error: 'CORS: Origin not allowed',
      origin: req.get('Origin')
    });
  }
  next(err);
});

// Start the server and sync the database
const startServer = async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connection established');
    
    await db.sync({ force: false, alter: false });
    console.log('✅ Database synchronized');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📋 Allowed origins:`, allowedOrigins);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();