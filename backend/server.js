import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import artistRoutes from './routes/artists.js';
import scanRoutes from './routes/scan.js';
import releaseRoutes from './routes/releases.js';

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
});
