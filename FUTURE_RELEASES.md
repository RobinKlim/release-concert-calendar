# ✅ Yes! It Works for Future Releases

## How It Works

The app is specifically designed to track **upcoming releases**. Here's how:

### 1. Data Fetching (Backend)

**Time Window:**
- **6 months in the past**
- **12 months in the future**

```javascript
// backend/services/musicbrainz.js:77
function filterRelevantReleases(releases, monthsBack = 6, monthsAhead = 12) {
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
```

**What this means:**
- Releases from **6 months ago** to **12 months in the future** are fetched and saved
- This gives you a full year ahead to plan

### 2. Upcoming Release Highlighting (Frontend)

**Visual Indicators:**
- Releases with dates **>= today** are marked as "Upcoming"
- They get a **green badge** in the calendar view
- Sorted chronologically so you see nearest releases first

```javascript
// frontend/src/app/pages/home/home.component.ts:120
isUpcoming(dateString: string): boolean {
  return new Date(dateString) >= new Date();
}
```

### 3. API Endpoint for Upcoming Only

The backend also provides a dedicated endpoint:

```
GET /api/releases/upcoming
```

This filters to show **only** future releases (releases >= today).

---

## Example Scenarios

### Scenario 1: New Album Announced
1. Artist announces album for **March 15, 2026**
2. MusicBrainz editors add it to the database
3. You click "Fetch Releases" in the app
4. The album appears with a **green "Upcoming" badge**
5. It shows in Calendar View under "March 15, 2026"

### Scenario 2: Surprise Drop
1. Artist drops surprise album **today**
2. It's added to MusicBrainz
3. You fetch releases
4. It appears at the top (most recent)
5. No "Upcoming" badge (it's today)

### Scenario 3: Planning Ahead
1. You scan your library in **February 2026**
2. App shows all releases until **February 2027**
3. You can plan purchases, pre-orders, listening sessions
4. As time passes, releases automatically shift from "Upcoming" to "Past"

---

## What MusicBrainz Includes

MusicBrainz tracks:
- ✅ **Announced albums** (with future release dates)
- ✅ **Singles** (often announced weeks/months ahead)
- ✅ **EPs** 
- ✅ **Compilations**
- ✅ **Remixes**
- ✅ **Live albums**

**Important:** The quality depends on MusicBrainz editors:
- Popular artists: Very reliable, updated quickly
- Indie/niche artists: May have delays or missing data

---

## Keeping Data Fresh

### When to Refresh

Click **"Fetch Releases"** to update when:
- A favorite artist announces a new release
- You want to check for newly added future dates
- It's been a few weeks since last fetch
- You added new artists to your library

### Automatic Filtering

The app automatically:
- Shows "Upcoming" badge based on **current date**
- Sorts releases chronologically
- Filters expired releases from the "Upcoming" endpoint

No manual date updates needed!

---

## Technical Details

### Data Structure

Each release includes:
```json
{
  "id": "release-group-id",
  "artist_mbid": "artist-mbid",
  "artist_name": "Artist Name",
  "title": "Album Title",
  "type": "Album",
  "date": "2026-03-15",
  "year": 2026
}
```

### Date Handling

- **Full dates:** `2026-03-15` (exact release date)
- **Month only:** `2026-03` (releases sometime in March)
- **Year only:** `2026` (releases sometime in 2026)

The app handles all formats correctly.

---

## Limitations

### What the App Shows
- ✅ Releases **announced** in MusicBrainz
- ✅ Up to **12 months ahead**
- ✅ Automatic "Upcoming" detection

### What It Doesn't Show (Yet)
- ❌ Rumored releases (not in MusicBrainz)
- ❌ Releases beyond 12 months
- ❌ Pre-order links
- ❌ Notifications when new releases are added

---

## Future Enhancements

Potential improvements:
1. **Adjustable time window** (user sets monthsAhead)
2. **Email notifications** for new releases
3. **Spotify integration** (pre-save upcoming albums)
4. **Calendar export** (ICS file for your calendar app)
5. **RSS feed** per artist

---

## Real-World Example

Let's say you have **The Beatles** and **Romy** in your library:

**Today: February 8, 2026**

**Fetched Data (Feb 8, 2026):**
- Rubber Soul (Remastered) - Already released
- Romy - Mid Air - Released 2023
- Romy - New Single - **April 5, 2026** ← Upcoming! 🎵
- The Beatles - Expanded Edition - **June 2026** ← Upcoming! 🎵

**Calendar View:**
```
April 5, 2026 [Upcoming]
├─ Romy - New Single (Single)

June 2026 [Upcoming]
├─ The Beatles - Expanded Edition (Album)
```

---

## Summary

✅ **Yes, the app fully supports future releases!**

- Fetches releases up to **12 months ahead**
- Highlights upcoming releases with **green badges**
- Automatically updates which releases are "upcoming" based on **today's date**
- Works as long as MusicBrainz has the data

**The app is designed specifically for this use case!** 🎵
