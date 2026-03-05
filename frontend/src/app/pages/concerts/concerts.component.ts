import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Artist, Concert } from '../../services/api.service';
import { HeaderComponent } from '../../components/header/header.component';
import { LoadingOverlay } from '../../components/loading-overlay/loading-overlay';
import { ConcertTableComponent } from '../../components/concert-table/concert-table.component';
import { PageContainer } from '../../components/page-container/page-container';

@Component({
  selector: 'app-concerts',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, LoadingOverlay, ConcertTableComponent, PageContainer],
  templateUrl: './concerts.component.html'
})
export class ConcertsComponent implements OnInit, OnDestroy {
  artists = signal<Artist[]>([]);
  concerts = signal<Concert[]>([]);
  loading = signal(false);
  private sseSub?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadArtists();
    this.loadConcerts();

    this.sseSub = this.apiService.listenToEvents().subscribe((event) => {
      if (event.type === 'concerts-updated') {
        this.loadConcerts();
      }
      this.loadArtists();
    });
  }

  ngOnDestroy() {
    this.sseSub?.unsubscribe();
  }

  loadConcerts() {
    this.loading.set(true);
    this.apiService.getAllConcerts().subscribe({
      next: (concerts) => {
        this.concerts.set(concerts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading concerts:', err);
        this.loading.set(false);
      }
    });
  }

  loadArtists() {
    this.apiService.getArtists().subscribe({
      next: (artists) => {
        this.artists.set(artists);
      },
      error: (err) => {
        console.error('Error loading artists:', err);
      }
    });
  }

  get upcomingConcerts(): Concert[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.concerts()
      .filter(c => new Date(c.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  get pastConcerts(): Concert[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.concerts()
      .filter(c => new Date(c.date) < today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
