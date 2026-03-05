import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Artist, Concert, GeoResult } from '../../services/api.service';
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
  private searchSub?: Subscription;

  // Location filter
  cityQuery = signal('');
  cityResults = signal<GeoResult[]>([]);
  selectedCity = signal<GeoResult | null>(null);
  showDropdown = signal(false);
  radius = signal<number>(0);
  radiusOptions = [0, 25, 50, 100, 250, 500];
  showRadiusDropdown = signal(false);

  private citySearch$ = new Subject<string>();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadSettings();
    this.loadArtists();
    this.loadConcerts();

    this.sseSub = this.apiService.listenToEvents().subscribe((event) => {
      if (event.type === 'concerts-updated') {
        this.loadConcerts();
      }
      this.loadArtists();
    });

    this.searchSub = this.citySearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => query.length >= 2 ? this.apiService.geocode(query) : of([]))
    ).subscribe(results => {
      this.cityResults.set(results);
      this.showDropdown.set(results.length > 0);
    });
  }

  ngOnDestroy() {
    this.sseSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  private loadSettings() {
    this.apiService.getSettings().subscribe({
      next: (settings) => {
        if (settings['concertCity']) {
          this.selectedCity.set(settings['concertCity']);
          this.cityQuery.set(settings['concertCity'].name.split(',')[0]);
        }
        if (settings['concertRadius'] != null) {
          this.radius.set(settings['concertRadius']);
        }
      },
      error: () => {}
    });
  }

  private persistFilter() {
    const settings: Record<string, any> = {
      concertCity: this.selectedCity(),
      concertRadius: this.radius()
    };
    this.apiService.saveSettings(settings).subscribe({ error: () => {} });
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

  onCityInput(value: string) {
    this.cityQuery.set(value);
    if (!value) {
      this.selectedCity.set(null);
      this.cityResults.set([]);
      this.showDropdown.set(false);
      this.persistFilter();
      return;
    }
    this.citySearch$.next(value);
  }

  selectCity(index: number) {
    const result = this.cityResults()[index];
    if (result) {
      this.selectedCity.set(result);
      this.cityQuery.set(result.name.split(',')[0]);
      this.showDropdown.set(false);
      this.cityResults.set([]);
      this.persistFilter();
    }
  }

  clearCity() {
    this.cityQuery.set('');
    this.selectedCity.set(null);
    this.cityResults.set([]);
    this.showDropdown.set(false);
    this.persistFilter();
  }

  hideDropdown() {
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  onRadiusSelect(value: number) {
    this.radius.set(value);
    this.showRadiusDropdown.set(false);
    this.persistFilter();
  }

  hideRadiusDropdown() {
    setTimeout(() => this.showRadiusDropdown.set(false), 200);
  }

  private filterByLocation(concerts: Concert[]): Concert[] {
    const city = this.selectedCity();
    const r = this.radius();
    if (!city || r === 0) return concerts;

    return concerts.filter(c => {
      if (c.lat != null && c.lng != null) {
        const dist = this.haversine(city.lat, city.lng, c.lat, c.lng);
        return dist <= r;
      }
      const cityName = city.name.split(',')[0].toLowerCase();
      return c.city.toLowerCase().includes(cityName);
    });
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  get upcomingConcerts(): Concert[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = this.concerts()
      .filter(c => new Date(c.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return this.filterByLocation(filtered);
  }

  get pastConcerts(): Concert[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = this.concerts()
      .filter(c => new Date(c.date) < today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return this.filterByLocation(filtered);
  }
}
