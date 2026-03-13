import cron from 'node-cron';
import { EventEmitter } from 'events';
import { getStaleArtists, updateArtistLastUpdated, saveReleases } from './database.js';
import { getArtistReleases, filterRelevantReleases } from './musicbrainz.js';

export const cronEmitter = new EventEmitter();

let isFetching = false;

async function fetchReleasesForStaleArtists() {
  if (isFetching) {
    console.log('[ReleaseCron] Previous fetch still running, skipping this tick');
    return;
  }

  isFetching = true;
  try {
    const staleArtists = getStaleArtists();

    if (staleArtists.length === 0) {
      return;
    }

    console.log(`[ReleaseCron] Found ${staleArtists.length} stale artist(s), fetching...`);

    for (const artist of staleArtists) {
      try {
        console.log(`[ReleaseCron] Fetching releases for ${artist.name}...`);
        const releases = await getArtistReleases(artist.mbid);
        const relevantReleases = filterRelevantReleases(releases);

        if (relevantReleases.length > 0) {
          saveReleases(artist.mbid, relevantReleases);
          console.log(`[ReleaseCron] Saved ${relevantReleases.length} releases for ${artist.name}`);
          cronEmitter.emit('artist-updated', { mbid: artist.mbid, name: artist.name });
        } else {
          console.log(`[ReleaseCron] No relevant releases found for ${artist.name}`);
        }

        updateArtistLastUpdated(artist.mbid);
      } catch (error) {
        console.error(`[ReleaseCron] Error fetching releases for ${artist.name}:`, error.message);
      }
    }

    console.log('[ReleaseCron] Finished fetching all stale artists');
  } catch (error) {
    console.error('[ReleaseCron] Error:', error.message);
  } finally {
    isFetching = false;
  }
}

export function startReleaseCron() {
  // Run immediately on startup
  fetchReleasesForStaleArtists();

  cron.schedule('*/10 * * * * *', () => {
    fetchReleasesForStaleArtists();
  });
  console.log('[ReleaseCron] Release fetch cron job started (every 10 seconds)');
}
