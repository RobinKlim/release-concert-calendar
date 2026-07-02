---
title: 'Library Page Search'
type: 'feature'
created: '2026-07-02'
status: 'done'
baseline_commit: '7f0bcead0d6807363a81b4a7f8f08a87451c7e96'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Library page (`/library`) has no way to find a specific album or artist — search/filter was explicitly deferred from v1. With growing library size, browsing three flat lists (Unranked/Listening needed/Ranked) to find one album is tedious.

**Approach:** Add a client-side search box to the Library page that filters (hides, does not reorder) all three visible sections by matching the query against album title or artist name.

## Boundaries & Constraints

**Always:**
- Search filters (hides non-matching rows) all three visible sections (Unranked, Listening needed, Ranked); it does not reorder them.
- Matching is case-insensitive substring match against `title` OR `artist_name`.
- Filtering is derived client-side state (`computed()` signal), not a backend call — the library is small, personal-scale.
- The Ranking Game overlay (`startGame`/`gamePair`/`nextPair`) ignores the active filter and continues to draw from the full unfiltered album set.
- Clearing the search box (empty string) restores the full unfiltered lists.

**Ask First:** none anticipated — scope is bounded to a single new client-side filter derived from existing `Album.title`/`Album.artist_name` fields already present in the API response.

**Never:** server-side/API search; debouncing (not needed at this data scale); sorting/reordering by relevance; persisting search state across page reloads; filtering within the Ranking Game. A year filter and click-to-filter-by-artist/year are deferred — see `spec-library-year-filter.md` (not yet created) / `deferred-work.md`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Search matches title | User types "geogaddi" | Albums whose title contains "geogaddi" (case-insensitive) remain visible in all three sections; others hidden | N/A |
| Search matches artist | User types "boards of canada" | Albums whose artist_name contains that substring remain visible | N/A |
| No matches | Search text matches no album | Each visible section shows zero rows; existing section-count headers (e.g. "Ranked (0)") reflect this — no new empty-state message needed | N/A |
| Clear search | User empties the search box | Full unfiltered lists restored across all three sections | N/A |
| Ranking Game unaffected | Search text active, user clicks "Rank Albums" | Game pairs are drawn from the full unfiltered album set, same as today | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/app/pages/library/library.component.ts` -- add `searchText` signal and `computed()` filtered variants of `unranked`/`ranked`/`listeningNeeded` for template consumption
- `frontend/src/app/pages/library/library.component.html` -- add a search input above the section toggle row; bind the three sections' `@for` loops to the new filtered signals instead of the raw `unranked()`/`ranked()`/`listeningNeeded()` (game overlay keeps using raw signals via `nextPair()`, untouched)

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/app/pages/library/library.component.ts` -- add `searchText = signal('')` and `filteredUnranked`/`filteredRanked`/`filteredListeningNeeded` `computed()` signals that case-insensitively substring-match `title` or `artist_name` against `searchText()`, returning the full list when `searchText()` is empty; add `onSearchChange(value: string)` setter -- implements the filter as derived state, no duplication of source arrays
- [x] `frontend/src/app/pages/library/library.component.html` -- add a text `<input>` bound to `searchText` via `(input)="onSearchChange($event.target.value)"` above the existing section-toggle button row; change the three `@for` loops (`unranked()`, `listeningNeeded()`, `ranked()`) to iterate the new filtered computed signals; leave drag/drop bindings (`onDragStart`, `onDropOn*`) and the game overlay's `ranked()`/`unranked()` reads untouched -- delivers the visible filtering behavior without touching DnD/game logic
- [x] `frontend/src/app/pages/library/library.component.spec.ts` -- add tests: filters by title substring, filters by artist substring (case-insensitive), empty query shows full list, no-match yields empty sections, game pair selection is unaffected by an active search -- covers the I/O matrix

**Acceptance Criteria:**
- Given the search box contains text, when the text matches neither an album's title nor its artist_name (case-insensitive), then that album is hidden from all three sections.
- Given the search box contains text that matches some albums, when those sections render, then only matching albums appear and section counts in headers reflect the filtered set.
- Given a search filter is active, when the user clears the search box, then all albums reappear in their original sections.
- Given the Ranking Game is active, when a search filter is set on the page behind it, then game pairs are still drawn from the full unfiltered album set.

## Design Notes

Filtering is purely derived state — `computed()` signals over the existing `unranked`/`ranked`/`listeningNeeded` source signals, following the project's existing pattern of `computed()` for derived values (see `showUnranked` etc. in the same component). Drag-and-drop (`onDragStart`/`onDropOn*`) and the ranking game continue to operate on the raw source signals and full album objects exactly as today — filtering only changes which rows the three `@for` loops render, not the underlying arrays.

## Verification

**Commands:**
- `cd frontend && npm test` -- expected: all existing Library specs pass plus new search-filter specs green

**Manual checks (if no CLI):**
- `cd frontend && npm start` then visit `/library`: type an artist/album substring and confirm all three sections filter down; clear it and confirm full lists return; start the Ranking Game with a filter active and confirm pairs still come from the whole library.

## Suggested Review Order

**Filter as derived state**

- Entry point: the three filtered signals derived from the existing source signals plus a new `searchText` signal.
  [`library.component.ts:32-37`](../../frontend/src/app/pages/library/library.component.ts#L32)

- Case-insensitive substring match against title or artist_name; empty query short-circuits to the full list.
  [`library.component.ts:89-96`](../../frontend/src/app/pages/library/library.component.ts#L89)

- Search input wired to `onSearchChange`, using the codebase's existing `$any()` pattern for `strictTemplates`.
  [`library.component.html:64-70`](../../frontend/src/app/pages/library/library.component.html#L64)

- The three `@for` loops and section-count badges now read the filtered signals instead of the raw ones.
  [`library.component.html:87`](../../frontend/src/app/pages/library/library.component.html#L87), [`:152`](../../frontend/src/app/pages/library/library.component.html#L152), [`:202`](../../frontend/src/app/pages/library/library.component.html#L202), [`:242`](../../frontend/src/app/pages/library/library.component.html#L242)

**Drag-drop fix (found in review, patched)**

- `onDropOnRanked` now resolves the drop target by album identity, not by a raw index — needed because the per-row index now comes from the *filtered* loop while the underlying `ranked` array is unfiltered; using the old numeric index would insert dropped albums at the wrong absolute position whenever a filter is active.
  [`library.component.ts:236-256`](../../frontend/src/app/pages/library/library.component.ts#L236)

- Row-level and container-level drop bindings updated to pass `album.id` / `null` instead of a filtered-array index.
  [`library.component.html:241`](../../frontend/src/app/pages/library/library.component.html#L241), [`:249`](../../frontend/src/app/pages/library/library.component.html#L249)

**Tests**

- Search filtering coverage (title/artist match, empty query, no match, game unaffected) plus a regression test for the drag-drop identity fix above.
  [`library.component.spec.ts:1`](../../frontend/src/app/pages/library/library.component.spec.ts#L1)
