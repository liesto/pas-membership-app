import dotenv from 'dotenv';

// Load .env.local from backend root
dotenv.config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { verifyClerkToken } from './middleware/auth.ts';
import salesforceRoutes from './routes/salesforce.ts';
import clerkRoutes from './routes/clerk.ts';

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8081';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging
app.use((req, express, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Clerk token verification middleware
app.use('/api', verifyClerkToken);

// Routes
app.use('/api/salesforce', salesforceRoutes);
app.use('/api/clerk', clerkRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 PAS Membership Backend Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🌐 CORS Origin: ${CORS_ORIGIN}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  // Test Salesforce connection on startup
  if (process.env.NODE_ENV !== 'test') {
    testConnections();
  }
});

async function testConnections() {
  try {
    // Test Salesforce connection
    console.log('Testing Salesforce connection...');
    const { verifySalesforceConnection } = await import('./services/auth.ts');
    const isConnected = await verifySalesforceConnection();

    if (isConnected) {
      console.log('✅ Salesforce connection OK\n');
    } else {
      console.log('❌ Salesforce connection failed\n');
    }
  } catch (error) {
    console.log('❌ Connection test error:', error);
  }
}
