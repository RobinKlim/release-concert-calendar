import express from 'express';
import { getAllArtists, getReleasesByArtist, getAllReleases, getUpcomingReleases, saveReleases } from '../services/database.js';
import { getArtistReleases, filterRelevantReleases } from '../services/musicbrainz.js';

const router = express.Router();

/**
 * GET /api/releases
 * Returns all releases
 */
router.get('/', (req, res) => {
  try {
    const releases = getAllReleases();
    res.json(releases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/releases/upcoming
 * Returns upcoming releases
 */
router.get('/upcoming', (req, res) => {
  try {
    const releases = getUpcomingReleases();
    res.json(releases);
  } catch (error) {
    console.error('Error fetching upcoming releases:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/releases/artist/:mbid
 * Returns releases for a specific artist
 */
router.get('/artist/:mbid', (req, res) => {
  try {
    const releases = getReleasesByArtist(req.params.mbid);
    res.json(releases);
  } catch (error) {
    console.error('Error fetching artist releases:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/releases/fetch
 * Fetches releases from MusicBrainz for all artists or a specific artist
 */
router.post('/fetch', async (req, res) => {
  const { artistMbid } = req.body;
  
  try {
    let artists;
    
    if (artistMbid) {
      const artist = await getArtist(artistMbid);
      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }
      artists = [artist];
    } else {
      artists = getAllArtists();
    }
    
    if (artists.length === 0) {
      return res.json({ message: 'No artists to fetch releases for' });
    }
    
    let totalReleases = 0;
    
    for (const artist of artists) {
      console.log(`Fetching releases for ${artist.name}...`);
      const releases = await getArtistReleases(artist.mbid);
      const relevantReleases = filterRelevantReleases(releases);
      
      if (relevantReleases.length > 0) {
        saveReleases(artist.mbid, relevantReleases);
        totalReleases += relevantReleases.length;
      }
    }
    
    res.json({
      message: `Fetched ${totalReleases} releases for ${artists.length} artist(s)`,
      artistCount: artists.length,
      releaseCount: totalReleases
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
