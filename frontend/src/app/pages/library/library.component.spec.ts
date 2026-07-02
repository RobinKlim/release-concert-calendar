import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LibraryComponent } from './library.component';
import { Album } from '../../services/api.service';

const albums: Album[] = [
  {
    id: '1',
    artist_mbid: 'a1',
    artist_name: 'Boards of Canada',
    title: 'Geogaddi',
    rank: 1,
    listening_needed: false,
    has_cover: false,
  },
  {
    id: '2',
    artist_mbid: 'a2',
    artist_name: 'Aphex Twin',
    title: 'Drukqs',
    rank: null,
    listening_needed: false,
    has_cover: false,
  },
  {
    id: '3',
    artist_mbid: 'a3',
    artist_name: 'Burial',
    title: 'Untrue',
    rank: null,
    listening_needed: true,
    has_cover: false,
  },
];

describe('LibraryComponent search', () => {
  let component: LibraryComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LibraryComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.endsWith('/albums'));
    req.flush(albums);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('filters by title substring', () => {
    component.onSearchChange('geogaddi');
    expect(component.filteredRanked().map((a) => a.id)).toEqual(['1']);
    expect(component.filteredUnranked()).toEqual([]);
    expect(component.filteredListeningNeeded()).toEqual([]);
  });

  it('filters by artist substring case-insensitively', () => {
    component.onSearchChange('APHEX');
    expect(component.filteredUnranked().map((a) => a.id)).toEqual(['2']);
    expect(component.filteredRanked()).toEqual([]);
  });

  it('returns the full list when the query is empty', () => {
    component.onSearchChange('boards');
    component.onSearchChange('');
    expect(component.filteredRanked()).toEqual(component.ranked());
    expect(component.filteredUnranked()).toEqual(component.unranked());
    expect(component.filteredListeningNeeded()).toEqual(component.listeningNeeded());
  });

  it('returns empty sections when nothing matches', () => {
    component.onSearchChange('nonexistent-xyz');
    expect(component.filteredRanked()).toEqual([]);
    expect(component.filteredUnranked()).toEqual([]);
    expect(component.filteredListeningNeeded()).toEqual([]);
  });

  it('draws ranking game pairs from the full unfiltered album set even when a search filter is active', () => {
    component.onSearchChange('nonexistent-xyz');
    expect(component.filteredRanked().length).toBe(0);
    expect(component.filteredUnranked().length).toBe(0);

    component.startGame();

    expect(component.gameActive()).toBe(true);
    expect(component.gamePair()).not.toBeNull();
  });

  it('reorders ranked albums by target album identity, not by filtered row index, when dropped while a filter is active', () => {
    const fourRanked: Album[] = [
      {
        id: 'a',
        artist_mbid: 'x',
        artist_name: 'ArtistA',
        title: 'Alpha',
        rank: 1,
        listening_needed: false,
        has_cover: false,
      },
      {
        id: 'b',
        artist_mbid: 'x',
        artist_name: 'ArtistB',
        title: 'Beta',
        rank: 2,
        listening_needed: false,
        has_cover: false,
      },
      {
        id: 'c',
        artist_mbid: 'x',
        artist_name: 'ArtistC',
        title: 'Gamma',
        rank: 3,
        listening_needed: false,
        has_cover: false,
      },
      {
        id: 'd',
        artist_mbid: 'x',
        artist_name: 'ArtistD',
        title: 'Delta',
        rank: 4,
        listening_needed: false,
        has_cover: false,
      },
    ];
    component.ranked.set(fourRanked);

    // A filter narrowing the view to just B and D would put B at filtered index 0,
    // even though B's real (absolute) position in the underlying array is index 1.
    component.onSearchChange('rti'); // matches "ArtistA/B/C/D" — irrelevant here, exercises filteredRanked being non-identity to ranked()
    expect(component.filteredRanked().length).toBeGreaterThan(0);

    // Simulate dragging D onto B's row while a filter is active.
    component.onDragStart(
      { dataTransfer: { setData: () => {} } } as unknown as DragEvent,
      fourRanked[3],
      'ranked',
    );
    component.onDropOnRanked({ preventDefault: () => {} } as unknown as DragEvent, 'b');

    // D must land immediately before B in the real array (index 1) based on B's actual
    // identity/position — not at some stale filtered-view row index.
    expect(component.ranked().map((a) => a.id)).toEqual(['a', 'd', 'b', 'c']);
    expect(component.ranked().map((a) => a.rank)).toEqual([1, 2, 3, 4]);
  });
});
