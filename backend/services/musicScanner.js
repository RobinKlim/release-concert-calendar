import { parseFile } from 'music-metadata';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { getArtistInfo } from './musicbrainz.js';

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.ogg', '.wav', '.wma', '.aac'];

/**
 * Recursively scans a directory for audio files and extracts MusicBrainz artist IDs
 * @param {string} dirPath - The directory path to scan
 * @returns {Promise<Array>} Array of artist objects with MBIDs
 */
export async function scanMusicDirectory(dirPath) {
  const mbids = new Set();

  async function scanDir(path) {
    try {
      const entries = await readdir(path);

      for (const entry of entries) {
        const fullPath = join(path, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await scanDir(fullPath);
        } else if (stats.isFile() && isAudioFile(entry)) {
          await processAudioFile(fullPath, mbids);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${path}:`, error.message);
    }
  }

  await scanDir(dirPath);

  // Look up each artist's name from MusicBrainz
  const artists = [];
  for (const mbid of mbids) {
    const info = await getArtistInfo(mbid);
    artists.push({
      mbid,
      name: info?.name || mbid
    });
  }

  return artists;
}

/**
 * Checks if a file is an audio file based on extension
 */
function isAudioFile(filename) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return AUDIO_EXTENSIONS.includes(ext);
}

/**
 * Processes an audio file and extracts album artist MBIDs
 */
async function processAudioFile(filePath, mbids) {
  try {
    const metadata = await parseFile(filePath);

    const albumArtistMBIDs = metadata.common.musicbrainz_albumartistid;

    if (albumArtistMBIDs && albumArtistMBIDs.length > 0) {
      for (const mbid of albumArtistMBIDs) {
        mbids.add(mbid);
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}
