import express from 'express';
import { getAllConcerts, getUpcomingConcerts, getConcertsByArtist, getAllArtists, saveConcerts, updateArtistConcertsLastUpdated } from '../services/database.js';
import { searchArtist, getArtistConcerts } from '../services/songkick.js';

const router = express.Router();

/**
 * GET /api/concerts
 * Returns all concerts
 */
router.get('/', (req, res) => {
  try {
    const concerts = getAllConcerts();
    res.json(concerts);
  } catch (error) {
    console.error('Error fetching concerts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/concerts/upcoming
 * Returns upcoming concerts
 */
router.get('/upcoming', (req, res) => {
  try {
    const concerts = getUpcomingConcerts();
    res.json(concerts);
  } catch (error) {
    console.error('Error fetching upcoming concerts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/concerts/artist/:mbid
 * Returns concerts for a specific artist
 */
router.get('/artist/:mbid', (req, res) => {
  try {
    const concerts = getConcertsByArtist(req.params.mbid);
    res.json(concerts);
  } catch (error) {
    console.error('Error fetching artist concerts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/concerts/fetch
 * Manually trigger concert fetching
 */
router.post('/fetch', async (req, res) => {
  try {
    const artists = getAllArtists();

    if (artists.length === 0) {
      return res.json({ message: 'No artists to fetch concerts for' });
    }

    let totalConcerts = 0;

    for (const artist of artists) {
      let songkickId = artist.songkick_id;

      if (!songkickId) {
        const result = await searchArtist(artist.name);
        if (!result) continue;
        songkickId = result.songkickId;
      }

      const concerts = await getArtistConcerts(songkickId);
      if (concerts.length > 0) {
        saveConcerts(artist.mbid, concerts);
        totalConcerts += concerts.length;
      }
      updateArtistConcertsLastUpdated(artist.mbid, songkickId);
    }

    res.json({
      message: `Fetched ${totalConcerts} concerts for ${artists.length} artist(s)`,
      artistCount: artists.length,
      concertCount: totalConcerts
    });
  } catch (error) {
    console.error('Error fetching concerts:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
