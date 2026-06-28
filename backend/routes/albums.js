import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAllAlbums, saveAlbumRanking } from '../services/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '../data');
const COVERS_DIR = join(DATA_DIR, 'covers');

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

router.get('/:id/cover', (req, res) => {
  try {
    const coverPath = join(COVERS_DIR, req.params.id);
    if (!existsSync(coverPath)) {
      return res.status(404).end();
    }
    const data = readFileSync(coverPath);
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(data);
  } catch (error) {
    res.status(500).end();
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
