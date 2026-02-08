import express from 'express';
import { getAllArtists, getArtist } from '../services/database.js';

const router = express.Router();

/**
 * GET /api/artists
 * Returns all artists from the database
 */
router.get('/', (req, res) => {
  try {
    const artists = getAllArtists();
    res.json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/artists/:mbid
 * Returns a specific artist by MBID
 */
router.get('/:mbid', (req, res) => {
  try {
    const artist = getArtist(req.params.mbid);
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    res.json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
