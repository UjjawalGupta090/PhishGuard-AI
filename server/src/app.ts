import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { analyzeRouter } from './routes/analyze.js';
import { historyRouter } from './routes/history.js';
import { authRouter } from './routes/auth.js';
import { requireCsrfHeader } from './middleware/requireCsrfHeader.js';
import { optionalAuth } from './middleware/optionalAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Security headers (allow frontend fonts and bundled assets in production)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Dynamic CORS configuration with credentials support
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, same-origin, server-to-server)
        if (!origin) return callback(null, true);

        // Always allow onrender.com subdomains, localhost, production, or explicitly allowed origins
        const isRenderOrLocal =
          origin.includes('.onrender.com') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1');

        if (
          isRenderOrLocal ||
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          env.NODE_ENV === 'production'
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'X-Requested-With'],
      exposedHeaders: ['X-Session-Id'],
    })
  );

  // Body parsing with strict 50kb limit (no request body logging)
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: true, limit: '50kb' }));
  app.use(cookieParser());

  // Global CSRF Protection on state-changing requests
  app.use(requireCsrfHeader);

  // Global Optional Auth (attaches req.user if present, leaves guests untouched)
  app.use(optionalAuth);

  // Mount API routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/analyze', analyzeRouter);
  app.use('/api/history', historyRouter);

  // Serve static assets from client/dist in production if present
  const clientDistPath = resolve(process.cwd(), 'client/dist');
  const serverDistClientPath = resolve(process.cwd(), '../client/dist');
  const resolvedDistPath = existsSync(clientDistPath)
    ? clientDistPath
    : existsSync(serverDistClientPath)
      ? serverDistClientPath
      : null;

  if (resolvedDistPath) {
    app.use(express.static(resolvedDistPath));
    // Any remaining non-API GET request falls back to index.html for SPA routing
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(resolve(resolvedDistPath, 'index.html'));
      }
      next();
    });
  } else {
    // Root endpoint info if client not built
    app.get('/', (_req, res) => {
      res.json({
        name: 'AI Phishing Awareness Tool API',
        status: 'active',
        docs: '/api/health',
      });
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
