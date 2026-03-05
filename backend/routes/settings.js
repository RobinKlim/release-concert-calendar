import express from 'express';
import { getSettings, saveSettings } from '../services/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    res.json(getSettings());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', (req, res) => {
  try {
    const merged = saveSettings(req.body);
    res.json(merged);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
