import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { processManuscriptAnalysis, formatErrorMessage } from './api/analyzeHandler';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use('/api/health', (_req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        });

        server.middlewares.use('/api/analyze', (req, res, next) => {
          if (req.method !== 'POST') return next();
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { text } = JSON.parse(body || '{}');
              if (!text || typeof text !== 'string' || !text.trim()) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Manuscript text is required.' }));
                return;
              }
              const result = await processManuscriptAnalysis(text);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              console.error('API middleware error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: formatErrorMessage(err) }));
            }
          });
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
