---
title: Album Library Ranking Page
status: final
created: 2026-06-27
updated: 2026-06-27
---

# Album Library Ranking Page

## Overview

Add a **Library** page to robins-musicbox that displays all locally owned albums discovered during music library scans and lets Robin rank them by personal preference using drag-and-drop or manual position entry. Position is the only ranking signal — no stars.

---

## Problem

Robin's music library is already scanned for artist data, but there is no way to express personal preference across it. The Library page fills this gap: a private, opinionated ranking of every album Robin owns.

---

## Goals

- Surface all scanned albums in one place
- Allow ranking by drag-and-drop or explicit position entry
- Make unranked albums impossible to overlook (inbox pattern — unranked on top)
- Persist ranking across app restarts
- Stay in sync with library rescans: new albums arrive unranked, removed albums disappear from the list

---

## Non-Goals

- No star ratings or any other rating dimension
- No concert or upcoming-release indicators
- No sharing, export, or social features
- No sorting other than user-defined rank

---

## Functional Requirements

### FR-1 — Album Discovery (Scanner Extension)

**FR-1.1** During an existing library scan, `musicScanner.js` must also extract per audio file:
- `album` — album title (`metadata.common.album`)
- `musicbrainz_albumid` — album MBID (`metadata.common.musicbrainz_albumid`)
- `musicbrainz_albumartistid` — artist MBID (already read; reused for linking)

**FR-1.2** Albums are deduplicated by `musicbrainz_albumid`. Multiple tracks sharing the same album MBID belong to one album record.

**FR-1.3** Files without a `musicbrainz_albumid` tag are skipped. *(Assumption: Robin's library is well-tagged; untagged albums are the exception.)*

**FR-1.4** On rescan, new albums arrive as **unranked**. Albums whose `musicbrainz_albumid` no longer appears in scan results are removed from storage, including their rank.

**FR-1.5** Existing rank positions of surviving albums are preserved across rescans and compacted (no gaps) after any removals.

---

### FR-2 — Data Storage

**FR-2.1** Albums are persisted in a new `albums.json` in `DATA_DIR`, managed exclusively through `database.js`.

**FR-2.2** Album record shape:
```json
{
  "id": "<musicbrainz_albumid>",
  "artist_mbid": "<musicbrainz_albumartistid>",
  "artist_name": "<string>",
  "title": "<string>",
  "rank": null
}
```
`rank` is `null` for unranked albums, or a positive integer (1 = highest) for ranked albums. Rank values are always unique and contiguous.

**FR-2.3** After any reorder operation, rank values are recalculated to remain contiguous with no gaps or duplicates.

---

### FR-3 — Backend API

**FR-3.1** `GET /api/albums` — returns all albums; ranked ones sorted ascending by `rank`, unranked ones with `rank: null`.

**FR-3.2** `PUT /api/albums/ranking` — accepts a full ordered array of ranked album IDs and a separate array of unranked album IDs; persists the new state to `albums.json`.

**FR-3.3** The albums route is mounted in `server.js` at `/api/albums` following the existing pattern.

---

### FR-4 — Library Page (Frontend)

**FR-4.1** New route `/library` added to `app.routes.ts`, rendering a `LibraryComponent` page.

**FR-4.2** "Library" nav link added to `header.component.ts` alongside Releases, Concerts, Artists.

**FR-4.3** The page has two sections, top to bottom:
- **Unranked** — albums with `rank: null`, displayed as a flat list. Always shown when unranked albums exist; acts as an inbox.
- **Ranked** — albums with a rank, displayed in ascending rank order (1 at top), each showing its position number.

**FR-4.4** Drag-and-drop interactions:
- Unranked → Ranked: drops album at the target position
- Reorder within Ranked: shifts surrounding items to accommodate
- Ranked → Unranked: removes rank, returns album to the inbox

**FR-4.5** The user can type a position number directly into a ranked album's position field to move it to that slot; all other positions adjust automatically.

**FR-4.6** Each album row displays: position number (ranked section only), album title, artist name.

**FR-4.7** Ranking changes are saved automatically after each drag or manual position entry (debounced; no explicit save button).

**FR-4.8** When no albums exist (library not yet scanned), an empty state prompts the user to scan their library.

**FR-4.9** The page uses the existing `PageContainer` and `HeaderComponent` components and follows Tailwind CSS styling conventions. No Angular Material.

---

## Data Flow

```
Rescan → musicScanner.js extracts album fields
       → database.js saveAlbums() — upsert, preserve rank, remove stale
       → albums.json

Library page load → GET /api/albums
                 → LibraryComponent renders unranked inbox + ranked list

User reorders    → PUT /api/albums/ranking
                 → albums.json updated
```

---

## Out of Scope for v1

- Album artwork
- Search or filter within the Library page
- Per-artist sub-rankings
- Keyboard-only reordering
