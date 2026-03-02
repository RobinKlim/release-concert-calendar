import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, Artist, Release } from '../../services/api.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  artists = signal<Artist[]>([]);
  releases = signal<Release[]>([]);
  loading = signal(false);
  fetching = signal(false);
  fetchSuccess = signal(false);

  // Type filter
  availableTypes = signal<string[]>([]);
  selectedTypes = signal<Set<string>>(new Set());
  showTypeDropdown = signal(false);

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadArtists();
    this.loadReleases();
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

  toggleTypeDropdown() {
    this.showTypeDropdown.set(!this.showTypeDropdown());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.type-dropdown') && this.showTypeDropdown()) {
      this.showTypeDropdown.set(false);
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
    this.fetchSuccess.set(false);

    this.apiService.fetchReleases().subscribe({
      next: (result) => {
        this.fetching.set(false);
        this.loadReleases();
        this.loadArtists();

        // Show success checkmark
        this.fetchSuccess.set(true);

        // Hide after 3 seconds
        setTimeout(() => {
          this.fetchSuccess.set(false);
        }, 3000);
      },
      error: (err) => {
        this.fetching.set(false);
        console.error('Error fetching releases:', err);
      }
    });
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  daysUntilRelease(dateString: string): string {
    const releaseDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    releaseDate.setHours(0, 0, 0, 0);

    const diffTime = releaseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    return `${diffDays}`;
  }
}
