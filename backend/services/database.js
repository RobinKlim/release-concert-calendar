import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || join(__dirname, '../data');
const ARTISTS_FILE = join(DATA_DIR, 'artists.json');
const RELEASES_FILE = join(DATA_DIR, 'releases.json');
const CONCERTS_FILE = join(DATA_DIR, 'concerts.json');
const SETTINGS_FILE = join(DATA_DIR, 'settings.json');
const ALBUMS_FILE = join(DATA_DIR, 'albums.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from JSON files
function loadArtists() {
  if (!existsSync(ARTISTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(ARTISTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading artists:', error);
    return [];
  }
}

function loadReleases() {
  if (!existsSync(RELEASES_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(RELEASES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading releases:', error);
    return [];
  }
}

function saveArtistsToFile(artists) {
  try {
    writeFileSync(ARTISTS_FILE, JSON.stringify(artists, null, 2));
  } catch (error) {
    console.error('Error saving artists:', error);
  }
}

function saveReleasesToFile(releases) {
  try {
    writeFileSync(RELEASES_FILE, JSON.stringify(releases, null, 2));
  } catch (error) {
    console.error('Error saving releases:', error);
  }
}

// Artist operations
export function saveArtists(artists) {
  const existing = loadArtists();
  console.log(`[Scan] Existing: ${existing.length} artists, Scanned: ${artists.length} artists`);
  console.log(`[Scan] Existing MBIDs:`, existing.map(a => a.name));
  console.log(`[Scan] Scanned MBIDs:`, artists.map(a => a.name));
  const existingMap = new Map(existing.map(a => [a.mbid, a]));
  const newMbids = new Set(artists.map(a => a.mbid));

  // Build new artist list, preserving metadata for artists that remain
  const updatedArtists = artists.map(artist => {
    const prev = existingMap.get(artist.mbid);
    return {
      mbid: artist.mbid,
      name: artist.name,
      last_updated: prev?.last_updated,
      concerts_last_updated: prev?.concerts_last_updated,
      songkick_id: prev?.songkick_id
    };
  });

  saveArtistsToFile(updatedArtists);

  // Remove releases and concerts for artists no longer in the library
  const removedMbids = existing
    .filter(a => !newMbids.has(a.mbid))
    .map(a => a.mbid);

  if (removedMbids.length > 0) {
    const removedSet = new Set(removedMbids);

    const releases = loadReleases().filter(r => !removedSet.has(r.artist_mbid));
    saveReleasesToFile(releases);

    const concerts = loadConcerts().filter(c => !removedSet.has(c.artist_mbid));
    saveConcertsToFile(concerts);

    console.log(`[Scan] Removed data for ${removedMbids.length} artist(s) no longer in library`);
  }
}

export function getAllArtists() {
  return loadArtists().sort((a, b) => a.name.localeCompare(b.name));
}

export function getArtist(mbid) {
  const artists = loadArtists();
  return artists.find(a => a.mbid === mbid);
}

export function updateArtistLastUpdated(mbid) {
  const artists = loadArtists();
  const artist = artists.find(a => a.mbid === mbid);
  if (artist) {
    artist.last_updated = Date.now();
    delete artist.releases_fetched_at;
    saveArtistsToFile(artists);
  }
}

export function getStaleArtists(maxAgeMs = 24 * 60 * 60 * 1000) {
  const artists = loadArtists();
  const now = Date.now();
  return artists.filter(a => !a.last_updated || (now - a.last_updated) > maxAgeMs);
}

// Release operations
export function saveReleases(artistMbid, releases) {
  const existing = loadReleases();
  const releaseMap = new Map(existing.map(r => [r.id, r]));
  
  const artist = getArtist(artistMbid);
  const artistName = artist ? artist.name : 'Unknown Artist';
  
  const now = Date.now();
  for (const release of releases) {
    releaseMap.set(release.id, {
      id: release.id,
      artist_mbid: artistMbid,
      artist_name: artistName,
      title: release.title,
      type: release.type,
      date: release.date,
      year: release.year,
      created_at: now
    });
  }
  
  saveReleasesToFile(Array.from(releaseMap.values()));
}

export function getReleasesByArtist(artistMbid) {
  const releases = loadReleases();
  return releases
    .filter(r => r.artist_mbid === artistMbid)
    .sort((a, b) => {
      if (b.date && a.date) return b.date.localeCompare(a.date);
      return b.year - a.year;
    });
}

export function getAllReleases() {
  const releases = loadReleases();
  return releases.sort((a, b) => {
    if (b.date && a.date) return b.date.localeCompare(a.date);
    return b.year - a.year;
  });
}

export function getUpcomingReleases() {
  const today = new Date().toISOString().split('T')[0];
  const releases = loadReleases();
  return releases
    .filter(r => r.date && r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Concert operations
function loadConcerts() {
  if (!existsSync(CONCERTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(CONCERTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading concerts:', error);
    return [];
  }
}

function saveConcertsToFile(concerts) {
  try {
    writeFileSync(CONCERTS_FILE, JSON.stringify(concerts, null, 2));
  } catch (error) {
    console.error('Error saving concerts:', error);
  }
}

export function saveConcerts(artistMbid, concerts) {
  const existing = loadConcerts();
  const concertMap = new Map(existing.map(c => [c.id, c]));

  const artist = getArtist(artistMbid);
  const artistName = artist ? artist.name : 'Unknown Artist';

  const now = Date.now();
  for (const concert of concerts) {
    concertMap.set(concert.id, {
      id: concert.id,
      artist_mbid: artistMbid,
      artist_name: artistName,
      event_name: concert.event_name,
      venue: concert.venue,
      city: concert.city,
      date: concert.date,
      url: concert.url,
      lat: concert.lat || null,
      lng: concert.lng || null,
      created_at: now
    });
  }

  saveConcertsToFile(Array.from(concertMap.values()));
}

export function getAllConcerts() {
  const concerts = loadConcerts();
  return concerts.sort((a, b) => {
    if (b.date && a.date) return a.date.localeCompare(b.date);
    return 0;
  });
}

export function getUpcomingConcerts() {
  const today = new Date().toISOString().split('T')[0];
  const concerts = loadConcerts();
  return concerts
    .filter(c => c.date && c.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getConcertsByArtist(artistMbid) {
  const concerts = loadConcerts();
  return concerts
    .filter(c => c.artist_mbid === artistMbid)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function updateArtistConcertsLastUpdated(mbid, songkickId) {
  const artists = loadArtists();
  const artist = artists.find(a => a.mbid === mbid);
  if (artist) {
    artist.concerts_last_updated = Date.now();
    if (songkickId) {
      artist.songkick_id = songkickId;
    }
    saveArtistsToFile(artists);
  }
}

export function getStaleConcertArtists(maxAgeMs = 24 * 60 * 60 * 1000) {
  const artists = loadArtists();
  const now = Date.now();
  return artists.filter(a => !a.concerts_last_updated || (now - a.concerts_last_updated) > maxAgeMs);
}

// Settings operations
export function getSettings() {
  if (!existsSync(SETTINGS_FILE)) {
    return {};
  }
  try {
    const data = readFileSync(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
}

export function saveSettings(settings) {
  try {
    const existing = getSettings();
    const merged = { ...existing, ...settings };
    writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
    return merged;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

// Album operations
function loadAlbums() {
  if (!existsSync(ALBUMS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(ALBUMS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading albums:', error);
    return [];
  }
}

function saveAlbumsToFile(albums) {
  try {
    writeFileSync(ALBUMS_FILE, JSON.stringify(albums, null, 2));
  } catch (error) {
    console.error('Error saving albums:', error);
  }
}

export function saveAlbums(scannedAlbums) {
  if (!scannedAlbums || scannedAlbums.length === 0) return;
  const existing = loadAlbums();
  const existingMap = new Map(existing.map(a => [a.id, a]));
  const scannedIds = new Set(scannedAlbums.map(a => a.id));

  const updated = scannedAlbums.map(album => {
    const prev = existingMap.get(album.id);
    const artist = getArtist(album.artist_mbid);
    return {
      id: album.id,
      artist_mbid: album.artist_mbid,
      artist_name: artist ? artist.name : 'Unknown Artist',
      title: album.title,
      rank: prev ? prev.rank : null,
    };
  });

  // Compact ranks after removals — preserve relative order of surviving ranked albums
  const ranked = updated
    .filter(a => a.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .map((a, i) => ({ ...a, rank: i + 1 }));
  const unranked = updated.filter(a => a.rank === null);

  saveAlbumsToFile([...ranked, ...unranked]);
}

export function getAllAlbums() {
  const albums = loadAlbums();
  const ranked = albums.filter(a => a.rank !== null).sort((a, b) => a.rank - b.rank);
  const unranked = albums.filter(a => a.rank === null);
  return [...unranked, ...ranked];
}

export function saveAlbumRanking(rankedIds, unrankedIds) {
  const albums = loadAlbums();
  const albumMap = new Map(albums.map(a => [a.id, a]));

  const updated = [];
  rankedIds.forEach((id, i) => {
    const album = albumMap.get(id);
    if (album) updated.push({ ...album, rank: i + 1 });
  });
  unrankedIds.forEach(id => {
    const album = albumMap.get(id);
    if (album) updated.push({ ...album, rank: null });
  });

  saveAlbumsToFile(updated);
}
