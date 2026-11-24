import { MiddlewareHandler } from 'hono';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  message?: string;
}

export const rateLimit = (options: RateLimitOptions): MiddlewareHandler => {
  const clientHistory = new Map<string, RateLimitRecord>();
  const windowMs = options.windowMs;
  const limit = options.limit;
  const message = options.message || 'Too many requests from this IP, please try again later.';

  return async (c, next) => {
    const forwardedFor = c.req.header('X-Forwarded-For');
    const clientIp = c.req.header('CF-Connecting-IP') || 
                     (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1');

    const now = Date.now();
    const record = clientHistory.get(clientIp);

    if (!record || now > record.resetTime) {
      // Create new window
      clientHistory.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });

      // Add standard headers
      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', (limit - 1).toString());
      c.header('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());
    } else {
      // Check limit
      record.count += 1;

      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, limit - record.count).toString());
      c.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

      if (record.count > limit) {
        return c.json({
          error: message,
          code: 'RATE_LIMIT_EXCEEDED',
        }, 429);
      }
    }

    await next();
  };
};

export default rateLimit;
