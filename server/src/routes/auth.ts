import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AnalysisRecord } from '../models/AnalysisRecord.js';
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
} from '../utils/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { optionalAuth, requireAuth } from '../middleware/optionalAuth.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email('Please provide a valid email address.').toLowerCase().trim(),
  password: z.string().min(10, 'Password must be at least 10 characters long.'),
});

// Helper for guest-to-account migration
async function migrateGuestRecords(sessionIdHeader: unknown, userId: mongoose.Types.ObjectId | string): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;

  const sessionId = typeof sessionIdHeader === 'string' ? sessionIdHeader.trim() : '';
  if (!sessionId) return;

  try {
    await AnalysisRecord.updateMany(
      { sessionId },
      {
        $set: { userId },
        $unset: { sessionId: 1 },
      }
    );
  } catch (err) {
    console.warn('[AUTH] Guest migration encountered error:', err);
  }
}

// POST /api/auth/signup
authRouter.post(
  '/signup',
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = credentialsSchema.parse(req.body);

      if (mongoose.connection.readyState !== 1) {
        throw new AppError(503, 'DB_UNAVAILABLE', 'Authentication database is currently unavailable.');
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Prevent email enumeration while giving clear feedback
        throw new AppError(409, 'USER_EXISTS', 'An account with this email address already exists.');
      }

      const passwordHash = await hashPassword(password);
      const user = new User({
        email,
        passwordHash,
      });

      await user.save();

      // Migrate any guest analyses from this browser session
      await migrateGuestRecords(req.headers['x-session-id'], user._id);

      // Issue tokens & cookies
      const { accessToken, refreshToken } = await generateTokens(user._id.toString(), user.email);
      setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        user: {
          id: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
authRouter.post(
  '/login',
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = credentialsSchema.parse(req.body);

      if (mongoose.connection.readyState !== 1) {
        throw new AppError(503, 'DB_UNAVAILABLE', 'Authentication database is currently unavailable.');
      }

      const user = await User.findOne({ email });
      if (!user) {
        // Constant-time mitigation against timing attacks and user enumeration
        await verifyPassword('dummy_password_timing_pad', '$argon2id$v=19$m=65536,t=3,p=4$dummyhash');
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
      }

      // Migrate guest records upon login
      await migrateGuestRecords(req.headers['x-session-id'], user._id);

      // Issue tokens & cookies
      const { accessToken, refreshToken } = await generateTokens(user._id.toString(), user.email);
      setAuthCookies(res, accessToken, refreshToken);

      res.status(200).json({
        user: {
          id: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.status(200).json({ success: true });
});

// POST /api/auth/refresh
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        throw new AppError(401, 'REFRESH_TOKEN_MISSING', 'Refresh token not found.');
      }

      const payload = await verifyRefreshToken(refreshToken);
      if (!payload || !payload.userId || !payload.email) {
        clearAuthCookies(res);
        throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token expired or invalid.');
      }

      if (mongoose.connection.readyState === 1) {
        const userExists = await User.exists({ _id: payload.userId });
        if (!userExists) {
          clearAuthCookies(res);
          throw new AppError(401, 'USER_NOT_FOUND', 'User record no longer exists.');
        }
      }

      const tokens = await generateTokens(payload.userId, payload.email as string);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
authRouter.get(
  '/me',
  optionalAuth,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(req.user!.id).select('email createdAt').lean();
        if (!user) {
          clearAuthCookies(res);
          throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found.');
        }
        res.status(200).json({
          user: {
            id: user._id.toString(),
            email: user.email,
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
          },
        });
        return;
      }

      // Memory or fallback
      res.status(200).json({
        user: {
          id: req.user!.id,
          email: req.user!.email,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/auth/me (Account deletion + full history deletion)
authRouter.delete(
  '/me',
  optionalAuth,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      if (mongoose.connection.readyState === 1) {
        // Delete all analysis history belonging to the user
        await AnalysisRecord.deleteMany({ userId });
        // Delete user record
        await User.findByIdAndDelete(userId);
      }

      clearAuthCookies(res);
      res.status(200).json({ success: true, message: 'Account and associated history deleted permanently.' });
    } catch (err) {
      next(err);
    }
  }
);
