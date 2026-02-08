import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, Artist, Release } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  artists = signal<Artist[]>([]);
  releases = signal<Release[]>([]);
  loading = signal(false);
  fetching = signal(false);
  
  // Filters
  availableTypes = signal<string[]>([]);
  selectedTypes = signal<Set<string>>(new Set());
  showUpcomingOnly = signal(false);
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
    
    // Initially select all types
    if (this.selectedTypes().size === 0) {
      this.selectedTypes.set(new Set(types));
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
      // All selected, deselect all
      this.selectedTypes.set(new Set());
    } else {
      // Some or none selected, select all
      this.selectedTypes.set(new Set(this.availableTypes()));
    }
  }

  toggleUpcomingOnly() {
    this.showUpcomingOnly.set(!this.showUpcomingOnly());
  }

  toggleTypeDropdown() {
    this.showTypeDropdown.set(!this.showTypeDropdown());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Close dropdown if clicking outside
    if (!target.closest('.type-dropdown') && this.showTypeDropdown()) {
      this.showTypeDropdown.set(false);
    }
  }

  get filteredReleases(): Release[] {
    let filtered = this.releases();

    // Filter by type
    if (this.selectedTypes().size > 0) {
      filtered = filtered.filter(r => this.selectedTypes().has(r.type));
    }

    // Filter by upcoming
    if (this.showUpcomingOnly()) {
      filtered = filtered.filter(r => this.isUpcoming(r.date));
    }

    return filtered;
  }

  fetchReleases() {
    this.fetching.set(true);

    this.apiService.fetchReleases().subscribe({
      next: (result) => {
        this.fetching.set(false);
        this.loadReleases();
        this.loadArtists();
        alert(result.message);
      },
      error: (err) => {
        this.fetching.set(false);
        alert(err.error?.error || 'Error fetching releases');
      }
    });
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  isUpcoming(dateString: string): boolean {
    return new Date(dateString) >= new Date();
  }
}
