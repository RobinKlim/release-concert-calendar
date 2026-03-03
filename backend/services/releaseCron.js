import cron from 'node-cron';
import { EventEmitter } from 'events';
import { getStaleArtists, updateArtistLastUpdated, saveReleases } from './database.js';
import { getArtistReleases, filterRelevantReleases } from './musicbrainz.js';

export const cronEmitter = new EventEmitter();

let isFetching = false;

async function fetchReleasesForStaleArtists() {
  if (isFetching) {
    console.log('[Cron] Previous fetch still running, skipping this tick');
    return;
  }

  isFetching = true;
  try {
    const staleArtists = getStaleArtists();

    if (staleArtists.length === 0) {
      console.log('[Cron] All artists are up to date');
      return;
    }

    console.log(`[Cron] Found ${staleArtists.length} stale artist(s), fetching...`);

    for (const artist of staleArtists) {
      try {
        console.log(`[Cron] Fetching releases for ${artist.name}...`);
        const releases = await getArtistReleases(artist.mbid);
        const relevantReleases = filterRelevantReleases(releases);

        if (relevantReleases.length > 0) {
          saveReleases(artist.mbid, relevantReleases);
          console.log(`[Cron] Saved ${relevantReleases.length} releases for ${artist.name}`);
        } else {
          console.log(`[Cron] No relevant releases found for ${artist.name}`);
        }

        updateArtistLastUpdated(artist.mbid);
        cronEmitter.emit('artist-updated', { mbid: artist.mbid, name: artist.name });
      } catch (error) {
        console.error(`[Cron] Error fetching releases for ${artist.name}:`, error.message);
      }
    }

    console.log('[Cron] Finished fetching all stale artists');
  } catch (error) {
    console.error('[Cron] Error:', error.message);
  } finally {
    isFetching = false;
  }
}

export function startReleaseCron() {
  // Run immediately on startup
  fetchReleasesForStaleArtists();

  cron.schedule('*/10 * * * * *', () => {
    console.log('[Cron] Tick');
    fetchReleasesForStaleArtists();
  });
  console.log('[Cron] Release fetch cron job started (every 10 seconds)');
}
