import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { HealthResponse } from '../types/contract.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response<HealthResponse>) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isLlmConfigured = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);

  const response: HealthResponse = {
    status: isDbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: isDbConnected ? 'connected' : 'disconnected',
    llmConfigured: isLlmConfigured,
  };

  res.status(isDbConnected ? 200 : 503).json(response);
});
