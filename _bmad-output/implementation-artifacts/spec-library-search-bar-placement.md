---
title: 'Library Search Bar Placement'
type: 'chore'
created: '2026-07-02'
status: 'done'
route: 'one-shot'
---

# Library Search Bar Placement

## Intent

**Problem:** The search box sat on its own row above the section-filter toggle buttons (Unranked/Listening needed/Ranked), taking extra vertical space for no reason on a laptop-only app.

**Approach:** Move the search input into the same row as the filter toggle buttons, positioned right after Ranked and before the right-aligned "Rank Albums" button — grouped visually with the filters on the left, no responsive/mobile stacking needed.

## Suggested Review Order

- Search input moved into the filter-toggle row, right after the Ranked button, ahead of the right-pinned Rank Albums button.
  [`library.component.html:100`](../../frontend/src/app/pages/library/library.component.html#L100)
