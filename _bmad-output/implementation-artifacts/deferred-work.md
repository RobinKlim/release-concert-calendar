# Deferred Work

## From: album-library-ranking

- **No atomic JSON writes** — all five data files (artists, releases, concerts, albums, settings) use `writeFileSync` which truncates before rewriting. A crash mid-write leaves corrupt/empty JSON. Fix: write to `.tmp` then `rename()` atomically. Affects all data files, not just albums.
- **Compilation albums store only first `artist_mbid`** — albums with multiple `musicbrainz_albumartistid` entries (Various Artists, compilations) are stored with `albumArtistMBIDs[0]` only. Low impact for v1 but should be revisited if multi-artist albums appear with wrong artist names.
- **`saveAlbumRanking` partial update risk** — if a client sends a subset of IDs, albums absent from both `ranked` and `unranked` arrays are silently dropped. Currently safe because the frontend always sends the complete picture, but fragile to future API consumers.
