import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Album } from '../../services/api.service';
import { HeaderComponent } from '../../components/header/header.component';
import { PageContainer } from '../../components/page-container/page-container';

type FilterKey = 'unranked' | 'ranked' | 'listeningNeeded';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, PageContainer],
  templateUrl: './library.component.html',
})
export class LibraryComponent implements OnInit, OnDestroy {
  unranked = signal<Album[]>([]);
  ranked = signal<Album[]>([]);
  listeningNeeded = signal<Album[]>([]);
  loading = signal(false);
  error = signal('');

  gameActive = signal(false);
  gamePair = signal<[Album, Album] | null>(null);

  visibleSections = signal<Set<FilterKey>>(new Set(['unranked', 'ranked', 'listeningNeeded']));

  showUnranked = computed(() => this.visibleSections().has('unranked'));
  showRanked = computed(() => this.visibleSections().has('ranked'));
  showListeningNeeded = computed(() => this.visibleSections().has('listeningNeeded'));

  private draggedAlbum: Album | null = null;
  private dragSource: 'ranked' | 'unranked' | 'listeningNeeded' | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private apiService: ApiService) {}

  coverUrl(albumId: string): string {
    return this.apiService.albumCoverUrl(albumId);
  }

  ngOnInit() {
    this.loadAlbums();
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }

  loadAlbums() {
    this.loading.set(true);
    this.apiService.getAlbums().subscribe({
      next: (albums) => {
        this.listeningNeeded.set(albums.filter(a => a.listening_needed));
        this.unranked.set(albums.filter(a => a.rank === null && !a.listening_needed));
        this.ranked.set(albums.filter(a => a.rank !== null).sort((a, b) => a.rank! - b.rank!));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load albums');
        this.loading.set(false);
        console.error('Error loading albums:', err);
      }
    });
  }

  toggleSection(key: FilterKey) {
    const current = new Set(this.visibleSections());
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    this.visibleSections.set(current);
  }

  isSectionVisible(key: FilterKey): boolean {
    return this.visibleSections().has(key);
  }

  moveToListeningNeeded(album: Album) {
    this.unranked.update(list => list.filter(a => a.id !== album.id));
    this.listeningNeeded.update(list => [...list, { ...album, listening_needed: true }]);
    this.scheduleSave();
  }

  markGameAlbumAsListeningNeeded(album: Album) {
    this.unranked.update(list => list.filter(a => a.id !== album.id));
    this.ranked.update(list =>
      list.filter(a => a.id !== album.id).map((a, i) => ({ ...a, rank: i + 1 }))
    );
    this.listeningNeeded.update(list => [...list, { ...album, rank: null, listening_needed: true }]);
    this.scheduleSave();

    const next = this.nextPair();
    if (next) {
      this.gamePair.set(next);
    } else {
      this.stopGame();
    }
  }

  moveToUnranked(album: Album) {
    this.listeningNeeded.update(list => list.filter(a => a.id !== album.id));
    this.unranked.update(list => [...list, { ...album, listening_needed: false }]);
    this.scheduleSave();
  }

  // --- Ranking game ---

  startGame() {
    const pair = this.nextPair();
    if (!pair) return;
    this.gamePair.set(pair);
    this.gameActive.set(true);
  }

  stopGame() {
    this.gameActive.set(false);
    this.gamePair.set(null);
  }

  pickWinner(winner: Album) {
    const pair = this.gamePair();
    if (!pair) return;
    const loser = pair[0].id === winner.id ? pair[1] : pair[0];
    this.applyGameResult(winner, loser);
    this.scheduleSave();

    const next = this.nextPair();
    if (next) {
      this.gamePair.set(next);
    } else {
      this.stopGame();
    }
  }

  private nextPair(): [Album, Album] | null {
    const unranked = this.unranked();
    const ranked = this.ranked();

    if (unranked.length > 0 && ranked.length > 0) {
      const u = unranked[Math.floor(Math.random() * unranked.length)];
      const r = ranked[Math.floor(Math.random() * ranked.length)];
      return Math.random() < 0.5 ? [u, r] : [r, u];
    }

    const all = [...unranked, ...ranked];
    if (all.length < 2) return null;
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  private applyGameResult(winner: Album, loser: Album) {
    const allRanked = [...this.ranked()];
    const allUnranked = [...this.unranked()];

    const loserWasUnranked = allUnranked.some(a => a.id === loser.id);
    const loserRankedIdx = allRanked.findIndex(a => a.id === loser.id);
    const winnerRankedIdx = allRanked.findIndex(a => a.id === winner.id);

    const newRanked = allRanked.filter(a => a.id !== winner.id && a.id !== loser.id);
    const newUnranked = allUnranked.filter(a => a.id !== winner.id && a.id !== loser.id);

    if (loserWasUnranked) {
      newRanked.splice(winnerRankedIdx, 0, winner);
      newRanked.push(loser);
    } else if (loserRankedIdx !== -1) {
      newRanked.splice(loserRankedIdx, 0, winner, loser);
    } else {
      newRanked.push(winner, loser);
    }

    this.ranked.set(newRanked.map((a, i) => ({ ...a, rank: i + 1 })));
    this.unranked.set(newUnranked);
  }

  // --- Drag & drop ---

  onDragStart(event: DragEvent, album: Album, source: 'ranked' | 'unranked' | 'listeningNeeded') {
    this.draggedAlbum = album;
    this.dragSource = source;
    event.dataTransfer?.setData('text/plain', album.id);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDropOnRanked(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    if (!this.draggedAlbum) return;

    const album = this.draggedAlbum;
    const source = this.dragSource;

    if (source === 'unranked') {
      this.unranked.update(list => list.filter(a => a.id !== album.id));
    } else if (source === 'ranked') {
      this.ranked.update(list => list.filter(a => a.id !== album.id));
    } else if (source === 'listeningNeeded') {
      this.listeningNeeded.update(list => list.filter(a => a.id !== album.id));
    }

    this.ranked.update(list => {
      const updated = [...list];
      updated.splice(targetIndex, 0, { ...album, rank: targetIndex + 1, listening_needed: false });
      return updated.map((a, i) => ({ ...a, rank: i + 1 }));
    });

    this.draggedAlbum = null;
    this.dragSource = null;
    this.scheduleSave();
  }

  onDropOnUnranked(event: DragEvent) {
    event.preventDefault();
    if (!this.draggedAlbum || this.dragSource === 'unranked') return;

    const album = this.draggedAlbum;
    const source = this.dragSource;

    if (source === 'ranked') {
      this.ranked.update(list =>
        list.filter(a => a.id !== album.id).map((a, i) => ({ ...a, rank: i + 1 }))
      );
    } else if (source === 'listeningNeeded') {
      this.listeningNeeded.update(list => list.filter(a => a.id !== album.id));
    }

    this.unranked.update(list => [...list, { ...album, rank: null, listening_needed: false }]);

    this.draggedAlbum = null;
    this.dragSource = null;
    this.scheduleSave();
  }

  onDropOnListeningNeeded(event: DragEvent) {
    event.preventDefault();
    if (!this.draggedAlbum || this.dragSource === 'listeningNeeded') return;

    const album = this.draggedAlbum;
    const source = this.dragSource;

    if (source === 'ranked') {
      this.ranked.update(list =>
        list.filter(a => a.id !== album.id).map((a, i) => ({ ...a, rank: i + 1 }))
      );
    } else if (source === 'unranked') {
      this.unranked.update(list => list.filter(a => a.id !== album.id));
    }

    this.listeningNeeded.update(list => [...list, { ...album, rank: null, listening_needed: true }]);

    this.draggedAlbum = null;
    this.dragSource = null;
    this.scheduleSave();
  }

  onPositionChange(album: Album, event: Event) {
    const input = event.target as HTMLInputElement;
    const newPos = parseInt(input.value, 10);
    const rankedList = this.ranked();

    if (isNaN(newPos) || newPos < 1 || newPos > rankedList.length) {
      input.value = String(album.rank);
      return;
    }

    this.ranked.update(list => {
      const without = list.filter(a => a.id !== album.id);
      without.splice(newPos - 1, 0, album);
      return without.map((a, i) => ({ ...a, rank: i + 1 }));
    });

    this.scheduleSave();
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const rankedIds = this.ranked().map(a => a.id);
      const unrankedIds = this.unranked().map(a => a.id);
      const listeningNeededIds = this.listeningNeeded().map(a => a.id);
      this.apiService.saveRanking(rankedIds, unrankedIds, listeningNeededIds).subscribe({
        error: (err) => console.error('Error saving ranking:', err)
      });
    }, 300);
  }
}
