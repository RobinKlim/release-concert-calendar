import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || join(__dirname, '../data');
const ARTISTS_FILE = join(DATA_DIR, 'artists.json');
const RELEASES_FILE = join(DATA_DIR, 'releases.json');

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
  const artistMap = new Map(existing.map(a => [a.mbid, a]));
  
  const now = Date.now();
  for (const artist of artists) {
    artistMap.set(artist.mbid, {
      mbid: artist.mbid,
      name: artist.name,
      track_count: artist.trackCount,
      last_updated: now
    });
  }
  
  saveArtistsToFile(Array.from(artistMap.values()));
}

export function getAllArtists() {
  return loadArtists().sort((a, b) => a.name.localeCompare(b.name));
}

export function getArtist(mbid) {
  const artists = loadArtists();
  return artists.find(a => a.mbid === mbid);
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
