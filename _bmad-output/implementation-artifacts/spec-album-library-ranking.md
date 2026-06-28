---
title: 'Album Library Ranking Page'
type: 'feature'
created: '2026-06-27'
status: 'done'
baseline_commit: 'f0b59815687fae473209d52a85d5e76aca92761d'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Robin's scanned music library has no way to express personal preference — there is nowhere to rank owned albums.

**Approach:** Extend the scanner to collect album metadata, persist albums in `albums.json`, expose a REST API, and add a `/library` page with an unranked inbox (top) and a drag-and-drop ranked list (below). Position is the only ranking signal.

## Boundaries & Constraints

**Always:**
- All data persistence through `database.js` only
- `process.env.DATA_DIR` governs the data path — never hardcode `backend/data/`
- Backend files use ESM (`import`/`export`) — no `require()`
- Angular: standalone components, signals for state, all HTTP through `ApiService`
- No Angular Material; Tailwind CSS only
- Albums without `musicbrainz_albumid` tag are skipped
- On rescan: new albums → unranked; removed albums → deleted including rank; surviving ranks preserved and compacted

**Ask First:**
- If a well-tagged album is missing from the Library page after a scan (could indicate a tag field name mismatch in `music-metadata`)

**Never:**
- Star ratings or any other rating dimension
- Concert / release indicators on the Library page
- New npm dependencies (use HTML5 native drag-and-drop API)
- NgModules

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Load page, albums exist | GET /api/albums | Unranked section top, ranked list below in rank order | Show error state if request fails |
| Drag unranked → ranked | Drop on position N | Album inserted at N, others shift down, autosave fires | No-op if drop target invalid |
| Drag ranked → ranked | Reorder within list | Positions recalculated contiguously, autosave fires | — |
| Drag ranked → unranked | Drop in unranked section | Album rank set to null, removed from ranked list, autosave fires | — |
| Type position number | User enters `3` in ranked album's input | Album moves to position 3, others adjust, autosave fires | Clamp to valid range (1–ranked.length) |
| Rescan removes album | Album MBID no longer in scan | Album removed from albums.json including rank; remaining ranks compacted | — |
| No albums yet | Library not scanned | Empty state: "Scan your library on the Artists page to get started" | — |

</frozen-after-approval>

## Code Map

- `backend/services/musicScanner.js` — extend `processAudioFile()` to collect album title + MBID
- `backend/services/database.js` — add album load/save/upsert/remove functions + `albums.json`
- `backend/routes/albums.js` — new: GET `/` and PUT `/ranking`
- `backend/server.js` — mount album route at `/api/albums`
- `frontend/src/app/services/api.service.ts` — add `Album` interface + `getAlbums()` + `saveRanking()` methods
- `frontend/src/app/pages/library/library.component.ts` + `.html` — new Library page
- `frontend/src/app/app.routes.ts` — add `/library` route
- `frontend/src/app/components/header/header.component.ts` — add Library nav item

## Tasks & Acceptance

**Execution:**
- [x] `backend/services/musicScanner.js` -- extend `processAudioFile()` to also collect `metadata.common.album` (title) and `metadata.common.musicbrainz_albumid`; accumulate albums in a `Map<albumId, {id, artist_mbid, title}>` passed alongside `mbids`; return albums from `scanMusicDirectory()` -- scanner currently discards album data
- [x] `backend/services/database.js` -- add `ALBUMS_FILE` path; add `loadAlbums()`, `saveAlbums(scannedAlbums)` (upsert preserving rank, remove stale, compact ranks), `getAllAlbums()`, `saveAlbumRanking(rankedIds, unrankedIds)` -- all persistence must go here
- [x] `backend/routes/albums.js` -- new ESM route file: `GET /` calls `getAllAlbums()`, `PUT /ranking` calls `saveAlbumRanking()`; follow `routes/artists.js` pattern exactly
- [x] `backend/server.js` -- import `albumRoutes` from `./routes/albums.js`; mount at `/api/albums`
- [x] `backend/routes/scan.js` -- update scan handler to call `saveAlbums()` with the albums returned from `scanMusicDirectory()`
- [x] `frontend/src/app/services/api.service.ts` -- add `Album` interface (`id`, `artist_mbid`, `artist_name`, `title`, `rank: number | null`); add `getAlbums(): Observable<Album[]>` and `saveRanking(ranked: string[], unranked: string[]): Observable<any>`
- [x] `frontend/src/app/pages/library/` -- create `library.component.ts` + `library.component.html`: signals for `unranked` and `ranked` album lists; load on `ngOnInit`; HTML5 drag-and-drop handlers (`dragstart`, `dragover`, `drop`) between sections; manual position input with `(change)` binding; debounced autosave via `saveRanking()`
- [x] `frontend/src/app/app.routes.ts` -- add `{ path: 'library', component: LibraryComponent }`
- [x] `frontend/src/app/components/header/header.component.ts` -- add `{ label: 'Library', path: '/library', exact: false }` to `navItems`

**Acceptance Criteria:**
- Given the library has been scanned, when the user navigates to `/library`, then albums appear split into Unranked (top) and Ranked (bottom) sections
- Given an unranked album, when the user drags it into the ranked list at position N, then it appears at position N and all other positions shift accordingly
- Given a ranked album, when the user drags it to the Unranked section, then its rank is removed and it moves to the inbox
- Given any reorder action, when the drop completes, then the new order is persisted automatically without a save button
- Given a user types position `3` in a ranked album's position field, when they confirm, then the album moves to rank 3 and surrounding ranks adjust
- Given a rescan that removes an artist, when the scan completes, then all albums for that artist are gone from the Library page
- Given the library has never been scanned, when the user visits `/library`, then an empty state message is shown

## Design Notes

**HTML5 drag-and-drop pattern for Angular (no CDK):**
```typescript
// On the draggable row
(dragstart)="onDragStart($event, album)"

// On drop targets
(dragover)="$event.preventDefault()"
(drop)="onDrop($event, targetIndex, 'ranked')"
```
Store the dragged album in a component property during drag. On drop, mutate the `ranked`/`unranked` signal arrays, then call the debounced save.

**Rank compaction:** after any mutation, reassign `rank` = index + 1 over the ranked array before saving. Never store gaps.

**Debounce autosave:** use `setTimeout` / `clearTimeout` pattern (300ms) — no RxJS needed for this.

## Verification

**Commands:**
- `cd backend && node server.js` -- expected: starts without error, `/api/albums` responds to GET with `[]`
- `cd frontend && npm run build` -- expected: compiles with no TypeScript errors

**Manual checks:**
- Scan a music library → navigate to `/library` → albums appear in Unranked
- Drag album to Ranked → position number appears → refresh page → order preserved
- Drag album back to Unranked → rank removed → refresh → still unranked

## Suggested Review Order

**Entry point — data model and scanner extension**

- Album deduplication by MBID; `albumMap` passed alongside `mbids` through recursive scan
  [`musicScanner.js:10`](../../backend/services/musicScanner.js#L10)

- Album record shape and rank-preserving upsert on every rescan
  [`database.js:305`](../../backend/services/database.js#L305)

**Backend API**

- Scan route wires `saveAlbums()` after `saveArtists()`; both receive scanner output
  [`scan.js:28`](../../backend/routes/scan.js#L28)

- GET/PUT routes; `PUT /ranking` validates array types, delegates entirely to `database.js`
  [`albums.js:1`](../../backend/routes/albums.js#L1)

- Route mounted at `/api/albums` between settings and SSE endpoint
  [`server.js:11`](../../backend/server.js#L11)

**Frontend — state and interactions**

- Signals for `unranked`/`ranked`; drag handlers; debounced `scheduleSave`; `ngOnDestroy` guard
  [`library.component.ts:1`](../../frontend/src/app/pages/library/library.component.ts#L1)

- Unranked inbox always visible (placeholder when empty); `stopPropagation` on row drops
  [`library.component.html:20`](../../frontend/src/app/pages/library/library.component.html#L20)

**Peripherals — wiring**

- `Album` interface and two new HTTP methods on the shared service
  [`api.service.ts:36`](../../frontend/src/app/services/api.service.ts#L36)

- Route and nav link registrations
  [`app.routes.ts:8`](../../frontend/src/app/app.routes.ts#L8)
  [`header.component.ts:13`](../../frontend/src/app/components/header/header.component.ts#L13)
