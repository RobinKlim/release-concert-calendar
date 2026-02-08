import express from 'express';
import { scanMusicDirectory } from '../services/musicScanner.js';
import { saveArtists } from '../services/database.js';

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
    const artists = await scanMusicDirectory(path);
    
    if (artists.length === 0) {
      return res.json({ 
        message: 'No artists with MusicBrainz IDs found',
        artists: []
      });
    }
    
    // Save artists to database
    saveArtists(artists);
    
    res.json({
      message: `Found ${artists.length} artists`,
      artists
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
