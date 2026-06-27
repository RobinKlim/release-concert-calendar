import express from 'express';
import { getAllAlbums, saveAlbumRanking } from '../services/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const albums = getAllAlbums();
    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/ranking', (req, res) => {
  try {
    const { ranked, unranked } = req.body;
    if (!Array.isArray(ranked) || !Array.isArray(unranked)) {
      return res.status(400).json({ error: 'ranked and unranked must be arrays' });
    }
    saveAlbumRanking(ranked, unranked);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error saving album ranking:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
