import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction): void {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (stateChangingMethods.includes(req.method.toUpperCase())) {
    const csrfHeader = req.headers['x-requested-with'];
    if (!csrfHeader) {
      throw new AppError(
        403,
        'CSRF_HEADER_MISSING',
        'State-changing requests require the X-Requested-With header to protect against CSRF attacks.'
      );
    }
  }

  next();
}
