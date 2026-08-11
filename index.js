import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.get('/', (_req, res) => res.status(200).json({ name: 'TinyURL API', status: 'ok' }));
app.use('/api', apiRoutes);
app.use('/', publicRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

export const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  await connectDB();
  const port = Number(process.env.PORT) || 3000;
  return app.listen(port, () => console.log(`TinyURL API listening on port ${port}`));
};

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href) {
  startServer().catch((error) => {
    console.error(`Unable to start server: ${error.message}`);
    process.exitCode = 1;
  });
}
