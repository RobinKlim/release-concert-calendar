import { parseFile } from 'music-metadata';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { getArtistInfo } from './musicbrainz.js';

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.ogg', '.wav', '.wma', '.aac'];

export async function scanMusicDirectory(dirPath, onProgress) {
  const mbids = new Set();
  const albumMap = new Map();

  async function scanDir(path) {
    try {
      const entries = await readdir(path);

      for (const entry of entries) {
        const fullPath = join(path, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await scanDir(fullPath);
        } else if (stats.isFile() && isAudioFile(entry)) {
          await processAudioFile(fullPath, mbids, albumMap);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${path}:`, error.message);
    }
  }

  await scanDir(dirPath);

  const artists = [];
  const resolved = [];
  const failed = [];

  for (const mbid of mbids) {
    const info = await getArtistInfo(mbid);
    const name = info?.name || null;

    artists.push({ mbid, name: name || mbid });

    if (name) {
      resolved.push(name);
      if (onProgress) onProgress({ mbid, name, status: 'resolved' });
    } else {
      failed.push(mbid);
      if (onProgress) onProgress({ mbid, name: mbid, status: 'failed' });
    }
  }

  const albums = Array.from(albumMap.values());

  return { artists, albums, resolved, failed };
}

function isAudioFile(filename) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return AUDIO_EXTENSIONS.includes(ext);
}

async function processAudioFile(filePath, mbids, albumMap) {
  try {
    const metadata = await parseFile(filePath);

    const albumArtistMBIDs = metadata.common.musicbrainz_albumartistid;
    const albumId = metadata.common.musicbrainz_albumid;
    const albumTitle = metadata.common.album;

    if (albumArtistMBIDs && albumArtistMBIDs.length > 0) {
      for (const mbid of albumArtistMBIDs) {
        mbids.add(mbid);
      }

      if (albumId && albumTitle && !albumMap.has(albumId)) {
        const picture = metadata.common.picture?.[0];
        albumMap.set(albumId, {
          id: albumId,
          artist_mbid: albumArtistMBIDs[0],
          title: albumTitle,
          cover: picture ? { data: picture.data, format: picture.format } : null,
        });
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}
