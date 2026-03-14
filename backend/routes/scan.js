import express from 'express';
import { scanMusicDirectory } from '../services/musicScanner.js';
import { saveArtists } from '../services/database.js';
import { EventEmitter } from 'events';

export const scanEmitter = new EventEmitter();

const router = express.Router();

/**
 * POST /api/scan
 * Scans a directory for music files and extracts artist information
 */
router.post('/', async (req, res) => {
  const { path } = req.body;

  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  try {
    console.log(`Scanning directory: ${path}`);

    const onProgress = (data) => {
      scanEmitter.emit('scan-progress', data);
    };

    const { artists, resolved, failed } = await scanMusicDirectory(path, onProgress);

    if (artists.length === 0) {
      return res.status(400).json({ error: 'No artists with MusicBrainz IDs found in directory' });
    }

    // Save artists to database (also cleans up removed artists, releases, concerts)
    saveArtists(artists);

    res.json({
      message: `Found ${artists.length} artists`,
      artists,
      resolved,
      failed
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
