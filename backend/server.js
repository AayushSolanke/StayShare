import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from 'passport';
import path from 'path';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import bookingRoutes from './routes/bookings.js';
import roommateRoutes from './routes/roommates.js';
import userRoutes from './routes/users.js';
import conversationRoutes from './routes/conversations.js';

// Import passport configuration
import './config/passport.js';

// Load environment variables robustly whether started from repo root or backend folder
(() => {
  // Try local .env in backend first
  let loaded = false;
  const backendEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
    loaded = true;
  }
  // If not found or missing critical vars, try parent repo root .env
  if (!loaded || (!process.env.MONGODB_URI && !process.env.PORT)) {
    const parentEnvPath = path.resolve(process.cwd(), '..', '.env');
    if (fs.existsSync(parentEnvPath)) {
      dotenv.config({ path: parentEnvPath });
      loaded = true;
    }
  }
  // Fallback to default dotenv search if still not loaded (harmless no-op if already loaded)
  if (!loaded) {
    dotenv.config();
  }
})();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(limiter);

// CORS configuration - support common dev ports and localhost variants
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);

    // Support multiple comma-separated URLs in FRONTEND_URL
    const envUrls = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : ['http://localhost:3000'];

    const explicitAllowed = [
      ...envUrls,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173'
    ];

    const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1):(3000|3001|5173)$/;

    if (explicitAllowed.includes(origin) || localhostRegex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport middleware
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flatmate Finder API is running!' });
});

//uptime bot ping route
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flatmate_finder';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    console.log('🔧 Starting server setup...');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Server bound to: 0.0.0.0:${PORT} (all interfaces)`);
      console.log('✅ Server is ready to accept connections');
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error.message);
        console.error('Stack:', error.stack);
      }
    });

    server.on('listening', () => {
      const addr = server.address();
      console.log(`🎯 Server is actually listening on ${addr.address}:${addr.port}`);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;