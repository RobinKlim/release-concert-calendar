import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/geocode?q=Berlin
 * Returns geocoding results from Nominatim (OpenStreetMap)
 */
router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        addressdetails: 1,
        'accept-language': 'en',
      },
      headers: {
        'User-Agent': 'ReleaseConcertCalendar/1.0.0',
      },
      timeout: 5000,
    });

    const results = response.data.map(item => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    res.json(results);
  } catch (error) {
    console.error('Geocode error:', error.message);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

export default router;
