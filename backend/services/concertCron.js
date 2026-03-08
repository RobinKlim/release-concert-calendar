import cron from 'node-cron';
import { EventEmitter } from 'events';
import { getAllArtists, getArtist, saveConcerts, updateArtistConcertsLastUpdated, getStaleConcertArtists } from './database.js';
import { searchArtist, getArtistConcerts } from './songkick.js';

export const concertCronEmitter = new EventEmitter();

let isFetching = false;

async function fetchConcertsForStaleArtists() {
  if (isFetching) {
    console.log('[ConcertCron] Previous fetch still running, skipping this tick');
    return;
  }

  isFetching = true;
  try {
    const staleArtists = getStaleConcertArtists();

    if (staleArtists.length === 0) {
      return;
    }

    console.log(`[ConcertCron] Found ${staleArtists.length} stale artist(s), fetching concerts...`);

    for (const artist of staleArtists) {
      try {
        let songkickId = artist.songkick_id;

        if (!songkickId) {
          console.log(`[ConcertCron] Searching Songkick for ${artist.name}...`);
          const result = await searchArtist(artist.name);
          if (!result) {
            console.log(`[ConcertCron] Artist not found on Songkick: ${artist.name}`);
            updateArtistConcertsLastUpdated(artist.mbid, null);
            continue;
          }
          songkickId = result.songkickId;
          updateArtistConcertsLastUpdated(artist.mbid, songkickId);
        }

        console.log(`[ConcertCron] Fetching concerts for ${artist.name} (songkick:${songkickId})...`);
        const concerts = await getArtistConcerts(songkickId);

        if (concerts.length > 0) {
          saveConcerts(artist.mbid, concerts);
          console.log(`[ConcertCron] Saved ${concerts.length} concerts for ${artist.name}`);
        } else {
          console.log(`[ConcertCron] No upcoming concerts for ${artist.name}`);
        }

        updateArtistConcertsLastUpdated(artist.mbid, songkickId);
        concertCronEmitter.emit('concerts-updated', { mbid: artist.mbid, name: artist.name });
      } catch (error) {
        console.error(`[ConcertCron] Error fetching concerts for ${artist.name}:`, error.message);
        updateArtistConcertsLastUpdated(artist.mbid, artist.songkick_id || null);
      }
    }

    console.log('[ConcertCron] Finished fetching all stale artists');
  } catch (error) {
    console.error('[ConcertCron] Error:', error.message);
  } finally {
    isFetching = false;
  }
}

export function startConcertCron() {
  fetchConcertsForStaleArtists();

  cron.schedule('*/10 * * * * *', () => {
    fetchConcertsForStaleArtists();
  });
  console.log('[ConcertCron] Concert fetch cron job started (every 10 seconds)');
}
