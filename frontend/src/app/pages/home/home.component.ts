import { Component, OnInit, signal } from '@angular/core';
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
      },
      error: (err) => {
        console.error('Error loading releases:', err);
        this.loading.set(false);
      }
    });
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
