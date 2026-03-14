import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import artistRoutes from './routes/artists.js';
import scanRoutes, { scanEmitter } from './routes/scan.js';
import releaseRoutes from './routes/releases.js';
import concertRoutes from './routes/concerts.js';
import geocodeRoutes from './routes/geocode.js';
import settingsRoutes from './routes/settings.js';
import { startReleaseCron, cronEmitter } from './services/releaseCron.js';
import { startConcertCron, concertCronEmitter } from './services/concertCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/artists', artistRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/concerts', concertRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/settings', settingsRoutes);

// SSE endpoint
app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  const onArtistUpdated = (data) => {
    res.write(`event: artist-updated\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onConcertsUpdated = (data) => {
    res.write(`event: concerts-updated\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onScanProgress = (data) => {
    res.write(`event: scan-progress\ndata: ${JSON.stringify(data)}\n\n`);
  };

  cronEmitter.on('artist-updated', onArtistUpdated);
  concertCronEmitter.on('concerts-updated', onConcertsUpdated);
  scanEmitter.on('scan-progress', onScanProgress);

  req.on('close', () => {
    cronEmitter.off('artist-updated', onArtistUpdated);
    concertCronEmitter.off('concerts-updated', onConcertsUpdated);
    scanEmitter.off('scan-progress', onScanProgress);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve Angular frontend (for Electron/production)
const frontendPath = process.env.FRONTEND_BUILD_PATH || join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startReleaseCron();
  startConcertCron();
});
