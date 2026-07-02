# Deferred Work

## From: album-library-ranking

- **No atomic JSON writes** — all five data files (artists, releases, concerts, albums, settings) use `writeFileSync` which truncates before rewriting. A crash mid-write leaves corrupt/empty JSON. Fix: write to `.tmp` then `rename()` atomically. Affects all data files, not just albums.
- **Compilation albums store only first `artist_mbid`** — albums with multiple `musicbrainz_albumartistid` entries (Various Artists, compilations) are stored with `albumArtistMBIDs[0]` only. Low impact for v1 but should be revisited if multi-artist albums appear with wrong artist names.
- **`saveAlbumRanking` partial update risk** — if a client sends a subset of IDs, albums absent from both `ranked` and `unranked` arrays are silently dropped. Currently safe because the frontend always sends the complete picture, but fragile to future API consumers.

## From: library-search-and-filters (split — carved off to keep spec-library-search in range)

- **Year field + year filter for Library page** — extract `metadata.common.year` in `musicScanner.js`, persist `year` on album records in `database.js`/`albums.json`, add `year: number | null` to the `Album` interface, display year on every album row/tile (`—` when untagged), add a year `<select>` dropdown (distinct years, descending, "All years" clears it), and make each tile's artist name and year clickable to set the corresponding filter. Must share the single-active-filter model with the search box (setting one clears the other) once implemented — see `spec-library-search.md` for the search-side half of that model.
