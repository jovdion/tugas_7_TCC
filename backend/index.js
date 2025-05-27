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
  'http://localhost:3000',
  'https://tugas-7-dion-913201672104.us-central1.run.app'  // Local development
];

app.use(cors({
  origin: (origin, callback) => {
    console.log('Request from origin:', origin);  // Log the origin for debugging
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);  // Allow the request
    } else {
      callback(new Error('Not allowed by CORS'));  // Reject the request
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,  // Cache preflight response for 24 hours
}));

// Handle preflight requests (OPTIONS)
app.options('*', (req, res) => {
  console.log('Preflight request received for:', req.path);
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');  // 24 hours
  res.sendStatus(200);
});

// Middleware for handling cookies and parsing JSON requests
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
      timestamp: new Date().toISOString(),
      cors: 'Configured',
      origins: allowedOrigins,
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: error.message,
    });
  }
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
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
