import axios from 'axios';

const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'ReleaseConcertCalendar/1.0.0';

// Rate limiting: MusicBrainz allows 1 request per second
const RATE_LIMIT_MS = 1000;
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Fetches artist information from MusicBrainz
 */
export async function getArtistInfo(mbid) {
  await rateLimit();
  
  try {
    const response = await axios.get(`${MUSICBRAINZ_BASE_URL}/artist/${mbid}`, {
      params: { fmt: 'json' },
      headers: { 'User-Agent': USER_AGENT }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching artist info for ${mbid}:`, error.message);
    return null;
  }
}

/**
 * Fetches release groups (albums, singles, etc.) for an artist
 */
export async function getArtistReleases(mbid) {
  await rateLimit();
  
  try {
    const response = await axios.get(`${MUSICBRAINZ_BASE_URL}/release-group`, {
      params: {
        artist: mbid,
        fmt: 'json',
        limit: 100,
        offset: 0
      },
      headers: { 'User-Agent': USER_AGENT }
    });
    
    const releaseGroups = response.data['release-groups'] || [];
    
    // Transform to our format
    return releaseGroups.map(rg => ({
      id: rg.id,
      title: rg.title,
      type: rg['primary-type'],
      secondaryTypes: rg['secondary-types'] || [],
      date: rg['first-release-date'],
      year: rg['first-release-date'] ? parseInt(rg['first-release-date'].split('-')[0]) : null
    }));
  } catch (error) {
    console.error(`Error fetching releases for artist ${mbid}:`, error.message);
    throw error;
  }
}

/**
 * Filters releases to get only upcoming and recent ones
 */
export function filterRelevantReleases(releases, monthsBack = 6, monthsAhead = 12) {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setMonth(pastDate.getMonth() - monthsBack);
  
  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + monthsAhead);
  
  return releases.filter(release => {
    if (!release.date) return false;
    
    const releaseDate = new Date(release.date);
    return releaseDate >= pastDate && releaseDate <= futureDate;
  });
}
