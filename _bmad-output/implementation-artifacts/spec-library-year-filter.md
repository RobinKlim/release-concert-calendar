---
title: 'Library Year Field & Filter'
type: 'feature'
created: '2026-07-02'
status: 'done'
baseline_commit: 'c02d8e492b24b6b96fb5bfdb7aad5f0d4d7e2382'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Albums on the Library page carry no year metadata, and there is no way to narrow the page down to a specific release year. This was split off from the original search request (see `spec-library-search.md`, already shipped) to keep specs in range.

**Approach:** Extract `year` through the existing scan pipeline into `albums.json`, display it on every album row, and add a year `<select>` dropdown plus click-to-filter on each album's artist name and year. The year filter shares the same single-active-filter model as the existing search box: setting one clears the other.

## Boundaries & Constraints

**Always:**
- `year`, when present, is a 4-digit integer parsed from `metadata.common.year` (via `music-metadata`), extracted in `musicScanner.js` next to `album`/`musicbrainz_albumid`, following the same per-file extraction pattern.
- Existing `albums.json` entries without a `year` key are treated as untagged (`year: null`) until the next rescan; `saveAlbums()` defaults to `null` when absent.
- Albums missing a `year` render `—` in the UI, are never selectable via the year filter, and are excluded whenever a year filter is active.
- The year `<select>` lists distinct years present across all loaded albums, sorted descending, with a leading "All years" option that clears the year filter.
- Exactly one filter is active at a time, shared with the existing search box: selecting a year clears `searchText`; typing in the search box clears the year filter. This extends the mutual-exclusion behavior already implemented for search.
- Clicking an album's artist name sets the search box to that exact artist name and clears the year filter. Clicking an album's year (when present) sets the year filter to that year and clears the search box. Clicking a `—` (no year) does nothing.
- The Ranking Game overlay continues to ignore all active filters and draws from the full unfiltered album set (unchanged from the search spec).

**Ask First:** none anticipated — bounded to one new metadata field threaded through the existing scan/persist/API pipeline plus filter-UI additions on top of the already-shipped search filtering.

**Never:** multi-year selection; year ranges; server-side filtering; persisting filter state across reloads; filtering within the Ranking Game.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Year filter via dropdown | User selects "2019" | All three sections show only albums with `year === 2019`; search box clears | N/A |
| Click artist name | User clicks artist on a tile | Search box set to that artist's exact name; year select resets to "All years" | N/A |
| Click year | User clicks year "2019" on a tile | Year select set to 2019; search box cleared | N/A |
| Click untagged year (`—`) | Album has no year | No filter change occurs | N/A |
| Switch from year to search | Year filter active, user types in search box | Year select resets to "All years"; search filter takes over | N/A |
| Untagged album, year filter active | Album has no `year`, a year is selected | Album is hidden | N/A |
| Untagged album, no year filter | Album has no `year`, "All years" or search active | Row shows `—` for year; visible per existing search rules | N/A |
| Rescan preserves old data | Pre-existing album lacks `year` key before rescan | Treated as `year: null` until rescanned | N/A |

</frozen-after-approval>

## Code Map

- `backend/services/musicScanner.js` -- extract `metadata.common.year` per file, store on the album map entry alongside `title`/`artist_mbid`
- `backend/services/database.js` -- `saveAlbums()`: persist `year: album.year ?? null` on each album record
- `frontend/src/app/services/api.service.ts` -- add `year: number | null` to the `Album` interface
- `frontend/src/app/pages/library/library.component.ts` -- add `selectedYear` signal, `availableYears` computed, refactor filtering into a shared `applyFilter()` used by all three `filtered*` computed signals, update `onSearchChange` to clear `selectedYear`, add `onYearSelect`, `filterByArtist`, `filterByYear`
- `frontend/src/app/pages/library/library.component.html` -- add year `<select>` beside the existing search input; render `{{ album.year ?? '—' }}` per row; make artist name and year clickable in all three sections

## Tasks & Acceptance

**Execution:**
- [x] `backend/services/musicScanner.js` -- in `processAudioFile()`, read `metadata.common.year` and include `year: metadata.common.year ?? null` when constructing the album map entry
- [x] `backend/services/database.js` -- in `saveAlbums()`, add `year: album.year ?? null` to the returned album record shape
- [x] `frontend/src/app/services/api.service.ts` -- add `year: number | null;` to `Album` interface
- [x] `frontend/src/app/pages/library/library.component.ts` -- add `selectedYear = signal<number | null>(null)`; add `availableYears = computed(...)` (distinct, descending, from `unranked()+ranked()+listeningNeeded()`); replace the three `filtered*` computed signals to call a shared `applyFilter(albums)` that filters by `selectedYear()` when set, else by `searchText()` via existing `filterAlbums` logic; update `onSearchChange` to also `this.selectedYear.set(null)`; add `onYearSelect(value: number | null)` (sets `selectedYear`, clears `searchText`), `filterByArtist(album)` (sets `searchText` to `album.artist_name`, clears `selectedYear`), `filterByYear(album)` (no-op if `album.year == null`, else sets `selectedYear`, clears `searchText`)
- [x] `frontend/src/app/pages/library/library.component.html` -- add a `<select>` bound to `selectedYear` via `(change)="onYearSelect(...)"` (parse `""` to `null`) next to the search input, with an "All years" option plus one `<option>` per `availableYears()`; in all three sections, render `{{ album.year ?? '—' }}` next to the title/artist block, with `(click)="filterByArtist(album); $event.stopPropagation()"` on the artist name and `(click)="filterByYear(album); $event.stopPropagation()"` on the year (only when `album.year` is present — style as non-interactive when `—`)
- [x] `frontend/src/app/pages/library/library.component.spec.ts` -- extend with tests: year filter matches exactly, untagged albums excluded when a year is selected, selecting a year clears search text and vice versa, clicking artist sets search and clears year, clicking year sets year and clears search, clicking `—` is a no-op

**Acceptance Criteria:**
- Given a year is selected in the dropdown, when an album's `year` does not equal the selected year (including `null`), then that album is hidden from all three sections.
- Given a search filter is active, when the user selects a year, then the search box clears and only the year filter applies (and vice versa when typing while a year is selected).
- Given an album tile/row, when the user clicks its artist name, then the search box is set to that artist's exact name and the year filter resets to "All years".
- Given an album tile/row with a year, when the user clicks its year, then the year filter is set to that year and the search box clears.
- Given an album tile/row without a year, when the user clicks the `—`, then no filter changes.
- Given the Ranking Game is active, when any filter is set on the page behind it, then game pairs are still drawn from the full unfiltered album set.

## Design Notes

`selectedYear` and `searchText` are kept as two separate signals rather than one unified "active filter" enum, matching the existing shipped pattern (`filterAlbums`) and minimizing changes to already-tested code — mutual exclusion is enforced procedurally in each setter (`onSearchChange`, `onYearSelect`, `filterByArtist`, `filterByYear`) rather than through a shared type. The already-fixed `onDropOnRanked` (resolves drop targets by album identity, not row index — see `spec-library-search.md`'s Suggested Review Order) requires no further changes: it is filter-agnostic by construction and already works correctly under any active filter, including this one.

## Verification

**Commands:**
- `cd frontend && npm test` -- expected: all existing Library specs pass plus new year-filter specs green

**Manual checks (if no CLI):**
- Rescan library (or inspect `backend/data/albums.json`) to confirm `year` is present on freshly scanned albums and `null` on pre-existing ones until rescanned.
- `cd frontend && npm start` then visit `/library`: confirm year renders per album, the dropdown filters correctly, clicking artist/year sets the right filter and clears the other, and dragging within a year-filtered Ranked list still reorders correctly.

## Suggested Review Order

**Filter state model**

- Entry point: `selectedYear` signal added alongside `searchText`; the three filtered signals now route through a shared `applyFilter()`.
  [`library.component.ts:33-45`](../../frontend/src/app/pages/library/library.component.ts#L33)

- Mutual exclusion: year takes precedence when set, else falls back to the existing search logic; `onSearchChange`/`onYearSelect`/`filterByArtist`/`filterByYear` each set one signal and clear the other.
  [`library.component.ts:98-122`](../../frontend/src/app/pages/library/library.component.ts#L98)

- `availableYears` is derived from the raw (unfiltered) source signals, not the filtered ones — avoids the dropdown's own options shrinking as a side effect of selecting a year.
  [`library.component.ts:35-41`](../../frontend/src/app/pages/library/library.component.ts#L35)

**Backend field**

- `year` extracted per-file alongside the existing `title`/`musicbrainz_albumid` fields, same first-file-wins pattern as `title`/`cover`.
  [`musicScanner.js:66-82`](../../backend/services/musicScanner.js#L66)

- Persisted with a `null` default; unlike `rank`/`listening_needed`, `year` is not carried forward from `prev` — it always reflects the latest scan.
  [`database.js:344-352`](../../backend/services/database.js#L344)

**UI**

- Year `<select>` beside the search input; native DOM value coercion handles the number/string round-trip.
  [`library.component.html:107-118`](../../frontend/src/app/pages/library/library.component.html#L107)

- Artist name and year rendered as separate clickable spans per row (three near-identical occurrences across Unranked/Listening needed/Ranked); year is only interactive when present.
  [`library.component.html:174-182`](../../frontend/src/app/pages/library/library.component.html#L174)

**Tests**

- Year-filter coverage: exact match, untagged exclusion, mutual clearing both directions, click handlers, no-op on untagged click, dropdown ordering, game unaffected.
  [`library.component.spec.ts:187`](../../frontend/src/app/pages/library/library.component.spec.ts#L187)
