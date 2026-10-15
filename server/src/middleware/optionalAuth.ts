import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // Read access token from httpOnly cookie or Authorization header
  let token = req.cookies?.access_token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload && payload.userId && payload.email) {
      req.user = {
        id: payload.userId,
        email: payload.email as string,
      };
    }
  }

  // Continue unconditionally — guest requests proceed seamlessly
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required for this operation.',
      },
    });
    return;
  }
  next();
}
