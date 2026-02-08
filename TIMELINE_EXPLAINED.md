# Release Timeline - How It Works

## Visual Timeline

```
                               TODAY
                                 ↓
    |-----------|-----------|-----------|-----------|-----------|
   -6 mo      -3 mo         NOW        +6 mo       +12 mo      +18 mo
    
    [====== FETCHED RELEASES ======]
    
    Past releases          |          Future releases
    (for context)          |          (upcoming!)
                           |
                           |
    Shown but not         |          Shown with
    marked "Upcoming"     |          "Upcoming" badge
```

## What Gets Fetched

When you click **"Fetch Releases"** on **February 8, 2026**:

```
August 2025 ←─────────── February 8, 2026 ─────────→ February 2027
  (-6 mo)                   (TODAY)                    (+12 mo)

|═══════════════════════════════════════════════════════════|
           ALL RELEASES IN THIS WINDOW ARE SAVED
```

## Examples by Date

### Past Releases (Still Shown)
```
August 2025     - Romy - Summer Single
September 2025  - The Beatles - Remaster Box Set
November 2025   - Artist X - Live Album
```
**Status:** Displayed, no "Upcoming" badge

### Current Month
```
February 2026   - Artist Y - New EP
```
**Status:** Could be past or upcoming depending on exact date

### Future Releases (UPCOMING!)
```
March 2026      - Romy - Spring Album          [Upcoming] 🎵
April 2026      - The Beatles - Deluxe Edition [Upcoming] 🎵
June 2026       - Artist Z - Debut Album       [Upcoming] 🎵
December 2026   - Various - Holiday Comp       [Upcoming] 🎵
January 2027    - Artist A - First Single      [Upcoming] 🎵
```
**Status:** All marked with green "Upcoming" badge

### Beyond Time Window
```
March 2027      - Artist B - Future Album
April 2027      - ...
```
**Status:** NOT fetched (beyond 12-month window)

---

## How It Updates Over Time

### Scenario: You Fetch on Feb 8, 2026

**February 8, 2026:**
```
Past:     Aug 2025 - Feb 2026 (7 releases)
Upcoming: Feb 2026 - Feb 2027 (15 releases)
Total:    22 releases shown
```

**March 15, 2026 (1 month later):**
- The app still shows the same 22 releases
- BUT releases before March 15 lose their "Upcoming" badge
- Calendar view automatically updates which ones are marked green
- No need to fetch again (unless new releases announced)

**August 15, 2026 (6 months later):**
- Old data from August 2025 is now over 12 months old
- You should click "Fetch Releases" again to:
  - Get new releases added to MusicBrainz
  - Extend the window forward (now Aug 2025 → Aug 2027)

---

## Best Practices

### When to Re-Fetch

**Weekly/Bi-weekly:** If you actively follow music and want latest announcements
**Monthly:** Good balance for most users
**As needed:** When you know an artist announced something new

### What Happens When You Re-Fetch

1. Backend queries MusicBrainz for all your artists (again)
2. Gets releases from [6 months ago] to [12 months ahead] (new window)
3. Merges with existing data (no duplicates)
4. Updates the display

**Example:**
```
First fetch (Feb 2026):  Aug 2025 → Feb 2027
Second fetch (Aug 2026): Feb 2026 → Aug 2027
```

You now have releases from **Aug 2025 → Aug 2027** (2 years!)

---

## API Rate Limiting

**Important:** MusicBrainz allows **1 request per second**

**Time to fetch:**
- 10 artists  = ~10 seconds
- 50 artists  = ~50 seconds (~1 minute)
- 100 artists = ~100 seconds (~2 minutes)

**Be patient!** The app shows progress in the backend console.

---

## Customizing the Time Window

You can adjust the time window in the code:

**File:** `backend/services/musicbrainz.js`

```javascript
// Line 77
function filterRelevantReleases(releases, monthsBack = 6, monthsAhead = 12)
```

**Change to:**
```javascript
function filterRelevantReleases(releases, monthsBack = 3, monthsAhead = 18)
```

This would fetch:
- 3 months in the past (instead of 6)
- 18 months in the future (instead of 12)

**Default values (6/12) are recommended** for most users.

---

## Summary

| Feature | Status | Details |
|---------|--------|---------|
| Past releases | ✅ Shown | For context (6 months back) |
| Future releases | ✅ Shown | Main feature (12 months ahead) |
| "Upcoming" badge | ✅ Auto | Dynamically based on today's date |
| Date sorting | ✅ Auto | Chronological order |
| Re-fetch support | ✅ Yes | Click "Fetch Releases" anytime |
| MusicBrainz sync | ✅ Yes | Gets latest announced releases |

**The app is built for tracking future releases! 🎵**
