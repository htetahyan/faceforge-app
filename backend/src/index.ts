import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import { secureHeaders } from 'hono/secure-headers';

// Route imports
import authRouter from './routes/auth.ts';
import facesRouter from './routes/faces.ts';
import templatesRouter from './routes/templates.ts';
import generateRouter from './routes/generate.ts';
import categoriesRouter from './routes/categories.ts';
import profileRouter from './routes/profile.ts';
import revenueCatRouter from './routes/revenuecat.ts';

// Middlewares & Jobs
import rateLimit from './middlewares/rate-limit.ts';
import { runCleanupJob } from './jobs/cleanup.ts';
import storageService from './services/storage.ts';

export const app = new Hono();

// Enforce standard enterprise secure security headers (Helmet equivalents)
app.use('*', secureHeaders());

// Global Logger and CORS
app.use('*', logger());

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use('*', cors({
  origin: allowedOrigin,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// Serve static public assets (User uploads, mock outputs, admin portal)
app.use('/public/*', serveStatic({
  root: './',
  rewriteRequestPath: (path) => path, // Keep path intact
}));

// Serves the Admin Dashboard HTML at /admin
app.get('/admin', async (c) => {
  try {
    const html = await Bun.file('./public/admin/index.html').text();
    return c.html(html);
  } catch (err) {
    return c.text('Admin HTML file not found on disk. Run seed/build steps.', 404);
  }
});

/**
 * Local Upload Proxy: Simulates Cloudflare R2 pre-signed PUT URLs in local development.
 * Receives raw binary image data via PUT, and writes it directly to the local public/ filesystem.
 */
app.put('/public/local-upload-proxy', async (c) => {
  const key = c.req.query('key');
  if (!key) {
    return c.json({ error: 'Missing target file key' }, 400);
  }

  try {
    const arrayBuffer = await c.req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Upload Proxy] Writing ${buffer.length} bytes to local public storage at key: ${key}`);
    await storageService.saveLocalFile(key, buffer);

    return c.json({ success: true, message: `File uploaded locally to key: ${key}` });
  } catch (err: any) {
    console.error('[Upload Proxy] Failed to write local file:', err);
    return c.json({ error: 'Failed to write upload to disk', details: err.message }, 500);
  }
});

// Rate Limiting Middlewares (Guards production against brute force / DDoS / spam)
app.use('/api/auth/*', rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: 'Too many auth attempts from this IP. Please try again in 1 minute.',
}));
app.use('/api/generate*', rateLimit({
  windowMs: 60 * 1000,
  limit: 25,
  message: 'Too many image generation requests. Please wait a moment before starting more tasks.',
}));
app.use('/api/templates*', rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  message: 'Too many requests. Please slow down.',
}));
app.use('/api/*', rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
}));

// Mount Routes
app.route('/api/auth', authRouter);
app.route('/api/faces', facesRouter);
app.route('/api/templates', templatesRouter);
app.route('/api/generate', generateRouter);
app.route('/api/categories', categoriesRouter);
app.route('/api/profile', profileRouter);
app.route('/api/revenuecat', revenueCatRouter);

/**
 * Secure Cron Job Trigger Endpoint: Purges completed task assets older than 30 days.
 * Triggered by scheduler (e.g., Cloudflare Triggers or cron daemon) using Webhook Secret.
 */
app.post('/api/jobs/cleanup', async (c) => {
  const secret = c.req.query('secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (!expectedSecret) {
    throw new Error('WEBHOOK_SECRET environment variable is required');
  }

  if (!secret || secret !== expectedSecret) {
    return c.json({ error: 'Forbidden: Invalid cron webhook secret' }, 403);
  }

  try {
    const deletedCount = await runCleanupJob();
    return c.json({
      success: true,
      message: `Successfully cleaned up expired generation data.`,
      deletedCount,
    });
  } catch (err: any) {
    return c.json({
      error: 'Cleanup job execution failed',
      details: err.message || err,
    }, 500);
  }
});

// Root health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'online',
    service: 'GlowUp Women AI Platform API',
    runtime: 'Bun',
    framework: 'Hono',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.onError((err, c) => {
  console.error('[Hono Error]', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
  }, 500);
});

// Export Hono App for Bun to serve
export default {
  port: parseInt(process.env.PORT || '3005'),
  hostname: '0.0.0.0', // Ensure accessible over local network for mobile testing
  fetch: app.fetch,
};
