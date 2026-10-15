import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AnalysisRecord } from '../models/AnalysisRecord.js';
import { HistoryResponse, HistoryItem } from '../types/contract.js';
import { AppError } from '../middleware/errorHandler.js';

export const historyRouter = Router();

// Helper to extract session or user query filter
function getScopeFilter(req: Request): Record<string, any> {
  const userId = (req as any).user?.id;
  if (userId) {
    return { userId };
  }

  const sessionIdHeader = req.headers['x-session-id'];
  const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader.trim() : '';

  if (!sessionId) {
    // Empty scope filter if no session passed
    return { sessionId: '__anonymous_empty_scope__' };
  }

  return { sessionId };
}

// GET /api/history (Paginated)
historyRouter.get(
  '/',
  async (req: Request, res: Response<HistoryResponse>, next: NextFunction): Promise<void> => {
    try {
      if (mongoose.connection.readyState !== 1) {
        // If DB not connected, return empty history gracefully
        res.status(200).json({ records: [], total: 0, page: 1, limit: 20 });
        return;
      }

      const scope = getScopeFilter(req);
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        AnalysisRecord.find(scope)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AnalysisRecord.countDocuments(scope),
      ]);

      const formattedRecords: HistoryItem[] = records.map((r) => ({
        id: r._id.toString(),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        riskLevel: r.riskLevel,
        finalScore: r.finalScore,
        indicatorSummary: r.indicatorSummary || [],
        redactedPreview: r.redactedPreview || '',
        explanationSummary: r.explanationSummary || '',
        aiAvailable: r.aiAvailable || false,
        channelGuess: r.channelGuess || 'unknown',
      }));

      res.status(200).json({
        records: formattedRecords,
        total,
        page,
        limit,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/history/:id
historyRouter.get(
  '/:id',
  async (req: Request<{ id: string }>, res: Response<HistoryItem>, next: NextFunction): Promise<void> => {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new AppError(404, 'RECORD_NOT_FOUND', 'Analysis record not found');
      }

      const { id } = req.params;
      const scope = getScopeFilter(req);

      if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(404, 'RECORD_NOT_FOUND', 'Analysis record not found');
      }

      const record = await AnalysisRecord.findOne({ _id: id, ...scope }).lean();
      if (!record) {
        throw new AppError(404, 'RECORD_NOT_FOUND', 'Analysis record not found or access denied');
      }

      res.status(200).json({
        id: record._id.toString(),
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
        riskLevel: record.riskLevel,
        finalScore: record.finalScore,
        indicatorSummary: record.indicatorSummary || [],
        redactedPreview: record.redactedPreview || '',
        explanationSummary: record.explanationSummary || '',
        aiAvailable: record.aiAvailable || false,
        channelGuess: record.channelGuess || 'unknown',
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/history/:id
historyRouter.delete(
  '/:id',
  async (req: Request<{ id: string }>, res: Response<{ success: boolean }>, next: NextFunction): Promise<void> => {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new AppError(404, 'RECORD_NOT_FOUND', 'Analysis record not found');
      }

      const { id } = req.params;
      const scope = getScopeFilter(req);

      if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(404, 'RECORD_NOT_FOUND', 'Analysis record not found');
      }

      const result = await AnalysisRecord.deleteOne({ _id: id, ...scope });
      if (result.deletedCount === 0) {
        throw new AppError(404, 'RECORD_NOT_FOUND', 'Record not found or already deleted');
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/history (Clear all in current session)
historyRouter.delete(
  '/',
  async (req: Request, res: Response<{ deletedCount: number }>, next: NextFunction): Promise<void> => {
    try {
      if (mongoose.connection.readyState !== 1) {
        res.status(200).json({ deletedCount: 0 });
        return;
      }

      const scope = getScopeFilter(req);
      const result = await AnalysisRecord.deleteMany(scope);
      res.status(200).json({ deletedCount: result.deletedCount || 0 });
    } catch (err) {
      next(err);
    }
  }
);
