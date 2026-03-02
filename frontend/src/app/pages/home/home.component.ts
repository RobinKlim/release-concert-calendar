import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, Artist, Release } from '../../services/api.service';
import { HeaderComponent } from '../../components/header/header.component';
import { VinylSpinnerComponent } from '../../components/vinyl-spinner/vinyl-spinner.component';
import { ReleaseTableComponent } from '../../components/release-table/release-table.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, VinylSpinnerComponent, ReleaseTableComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  artists = signal<Artist[]>([]);
  releases = signal<Release[]>([]);
  loading = signal(false);
  fetching = signal(false);

  // Type filter
  availableTypes = signal<string[]>([]);
  selectedTypes = signal<Set<string>>(new Set());

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadArtists();
    this.loadReleasesAndFetch();
  }

  loadReleasesAndFetch() {
    this.loading.set(true);
    this.apiService.getAllReleases().subscribe({
      next: (releases) => {
        this.releases.set(releases);
        this.updateAvailableTypes(releases);

        // Auto-fetch from MusicBrainz after loading cached releases
        this.fetchReleases();
      },
      error: (err) => {
        console.error('Error loading releases:', err);
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

  loadReleases() {
    this.loading.set(true);
    this.apiService.getAllReleases().subscribe({
      next: (releases) => {
        this.releases.set(releases);
        this.loading.set(false);
        this.updateAvailableTypes(releases);
      },
      error: (err) => {
        console.error('Error loading releases:', err);
        this.loading.set(false);
      }
    });
  }

  updateAvailableTypes(releases: Release[]) {
    const types = new Set<string>();
    releases.forEach(release => {
      if (release.type) {
        types.add(release.type);
      }
    });
    this.availableTypes.set(Array.from(types).sort());

    // Initially select only Album
    if (this.selectedTypes().size === 0) {
      this.selectedTypes.set(new Set(['Album']));
    }
  }

  toggleType(type: string) {
    const current = new Set(this.selectedTypes());
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    this.selectedTypes.set(current);
  }

  toggleAllTypes() {
    const current = this.selectedTypes();
    if (current.size === this.availableTypes().length) {
      this.selectedTypes.set(new Set());
    } else {
      this.selectedTypes.set(new Set(this.availableTypes()));
    }
  }

  get upcomingReleases(): Release[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.releases()
      .filter(r => new Date(r.date) >= today)
      .filter(r => this.selectedTypes().has(r.type))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  get pastReleases(): Release[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.releases()
      .filter(r => new Date(r.date) < today)
      .filter(r => this.selectedTypes().has(r.type))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  fetchReleases() {
    this.fetching.set(true);

    this.apiService.fetchReleases().subscribe({
      next: (result) => {
        this.fetching.set(false);
        this.loading.set(false);
        this.loadReleases();
        this.loadArtists();
      },
      error: (err) => {
        this.fetching.set(false);
        this.loading.set(false);
        console.error('Error fetching releases:', err);
      }
    });
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }
}
