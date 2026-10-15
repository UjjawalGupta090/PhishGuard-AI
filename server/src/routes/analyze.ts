import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { processAnalysis } from '../analysis/analyze.js';
import { analyzeRateLimiter } from '../middleware/rateLimit.js';
import { AnalyzeRequest, AnalyzeResponse } from '../types/contract.js';

export const analyzeRouter = Router();

// Apply rate limiting: 20 per minute per IP
analyzeRouter.post(
  '/',
  analyzeRateLimiter,
  async (
    req: Request<{}, {}, AnalyzeRequest>,
    res: Response<AnalyzeResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract guest session ID or generate one
      const sessionIdHeader = req.headers['x-session-id'];
      const sessionId =
        typeof sessionIdHeader === 'string' && sessionIdHeader.trim().length > 0
          ? sessionIdHeader.trim()
          : randomUUID();

      // Ensure session ID is exposed in response header for client persistence
      res.setHeader('X-Session-Id', sessionId);

      // (userId will be supplied when authenticated in Phase 5)
      const userId = (req as any).user?.id;

      const result = await processAnalysis(req.body, sessionId, userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);
