import { parseFile } from 'music-metadata';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.ogg', '.wav', '.wma', '.aac'];

/**
 * Recursively scans a directory for audio files and extracts MusicBrainz artist IDs
 * @param {string} dirPath - The directory path to scan
 * @returns {Promise<Array>} Array of artist objects with MBIDs
 */
export async function scanMusicDirectory(dirPath) {
  const artists = new Map();
  
  async function scanDir(path) {
    try {
      const entries = await readdir(path);
      
      for (const entry of entries) {
        const fullPath = join(path, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          await scanDir(fullPath);
        } else if (stats.isFile() && isAudioFile(entry)) {
          await processAudioFile(fullPath, artists);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${path}:`, error.message);
    }
  }
  
  await scanDir(dirPath);
  return Array.from(artists.values());
}

/**
 * Checks if a file is an audio file based on extension
 */
function isAudioFile(filename) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return AUDIO_EXTENSIONS.includes(ext);
}

/**
 * Processes an audio file and extracts artist information
 */
async function processAudioFile(filePath, artists) {
  try {
    const metadata = await parseFile(filePath);
    
    // Extract artist information
    const artistName = metadata.common.artist || metadata.common.albumartist;
    const artistMBID = metadata.common.musicbrainz_artistid?.[0];
    
    if (artistName && artistMBID) {
      if (!artists.has(artistMBID)) {
        artists.set(artistMBID, {
          mbid: artistMBID,
          name: artistName,
          trackCount: 1
        });
      } else {
        artists.get(artistMBID).trackCount++;
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}
