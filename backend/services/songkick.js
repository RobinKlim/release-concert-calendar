import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SONGKICK_BASE = 'https://www.songkick.com';

const RATE_LIMIT_MS = 2000;
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSince = now - lastRequestTime;
  if (timeSince < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSince));
  }
  lastRequestTime = Date.now();
}

async function fetchPage(url) {
  await rateLimit();
  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 15000,
  });
  return response.data;
}

/**
 * Search Songkick for an artist by name and return their Songkick ID.
 */
export async function searchArtist(artistName) {
  const url = `${SONGKICK_BASE}/search?query=${encodeURIComponent(artistName)}&type=artists`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  // Search result links have class "search-link" — nav links don't
  const artistLink = $('a.search-link[href*="/artists/"]').first();

  if (artistLink.length === 0) {
    return null;
  }

  const href = artistLink.attr('href');
  const match = href.match(/\/artists\/(\d+)-/);
  if (!match) {
    return null;
  }

  const name = artistLink.find('strong').text().trim() || artistLink.text().trim();
  return { songkickId: match[1], name };
}

/**
 * Scrape upcoming concerts for an artist from their Songkick calendar page.
 */
export async function getArtistConcerts(songkickId) {
  const url = `${SONGKICK_BASE}/artists/${songkickId}/calendar`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const concerts = [];

  // Songkick uses JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const events = Array.isArray(data) ? data : [data];
      for (const event of events) {
        if (event['@type'] === 'MusicEvent' || event['@type'] === 'Event') {
          const concert = parseLdJsonEvent(event);
          if (concert) concerts.push(concert);
        }
      }
    } catch { /* skip invalid JSON */ }
  });

  if (concerts.length > 0) {
    return concerts;
  }

  // Fallback: parse HTML event listings
  $('li[data-testid="eventListItem"], li.event-listings-element, div.event-listing').each((_, el) => {
    const concert = parseEventElement($, $(el));
    if (concert) concerts.push(concert);
  });

  // Another fallback: look for event containers with date/venue info
  if (concerts.length === 0) {
    $('.upcoming-events-list li, .event-listings li').each((_, el) => {
      const concert = parseEventElement($, $(el));
      if (concert) concerts.push(concert);
    });
  }

  return concerts;
}

function parseLdJsonEvent(event) {
  const name = event.name;
  const startDate = event.startDate;
  if (!startDate) return null;

  const date = startDate.split('T')[0];
  const location = event.location || {};
  const venue = location.name || '';
  const address = location.address || {};
  const city = [address.addressLocality, address.addressCountry]
    .filter(Boolean).join(', ');
  const url = event.url || '';

  // Extract a numeric ID from the URL
  const idMatch = url.match(/\/concerts\/(\d+)/);
  const id = idMatch ? idMatch[1] : `${date}-${name}`.replace(/\s+/g, '-').toLowerCase();

  const geo = location.geo || {};
  const lat = geo.latitude || null;
  const lng = geo.longitude || null;

  return { id, event_name: name, venue, city, date, url, lat, lng };
}

function parseEventElement($, $el) {
  // Try to find date
  const dateText = $el.find('time').attr('datetime')
    || $el.find('[datetime]').attr('datetime')
    || '';
  const date = dateText ? dateText.split('T')[0] : '';
  if (!date) return null;

  // Event name
  const eventName = $el.find('a.event-link, a[data-testid="eventName"], .event-name, strong a').first().text().trim()
    || $el.find('a').first().text().trim();

  // Venue
  const venue = $el.find('.venue-name, [data-testid="venueName"]').text().trim()
    || $el.find('.location .venue').text().trim();

  // City
  const city = $el.find('.location .city, [data-testid="venueLocation"]').text().trim()
    || $el.find('.venue-details .city').text().trim();

  // URL
  const eventLink = $el.find('a[href*="/concerts/"]').first().attr('href') || '';
  const url = eventLink.startsWith('http') ? eventLink : (eventLink ? SONGKICK_BASE + eventLink : '');

  const idMatch = url.match(/\/concerts\/(\d+)/);
  const id = idMatch ? idMatch[1] : `${date}-${eventName}`.replace(/\s+/g, '-').toLowerCase();

  return { id, event_name: eventName || 'Concert', venue, city, date, url, lat: null, lng: null };
}
