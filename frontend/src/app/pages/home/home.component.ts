import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Artist, Release } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  directoryPath = signal('');
  artists = signal<Artist[]>([]);
  releases = signal<Release[]>([]);
  loading = signal(false);
  scanning = signal(false);
  fetching = signal(false);
  error = signal('');
  selectedView = signal<'calendar' | 'list'>('calendar');

  constructor(private apiService: ApiService) {}

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

  scanDirectory() {
    if (!this.directoryPath()) {
      this.error.set('Please enter a directory path');
      return;
    }

    this.scanning.set(true);
    this.error.set('');

    this.apiService.scanDirectory(this.directoryPath()).subscribe({
      next: (result) => {
        this.scanning.set(false);
        this.loadArtists();
        alert(`Found ${result.artists.length} artists with MusicBrainz IDs`);
      },
      error: (err) => {
        this.scanning.set(false);
        this.error.set(err.error?.error || 'Error scanning directory');
      }
    });
  }

  fetchReleases() {
    this.fetching.set(true);
    this.error.set('');

    this.apiService.fetchReleases().subscribe({
      next: (result) => {
        this.fetching.set(false);
        this.loadReleases();
        alert(result.message);
      },
      error: (err) => {
        this.fetching.set(false);
        this.error.set(err.error?.error || 'Error fetching releases');
      }
    });
  }

  groupReleasesByDate() {
    const grouped = new Map<string, Release[]>();
    
    for (const release of this.releases()) {
      if (!release.date) continue;
      
      const date = release.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(release);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, releases]) => ({ date, releases }));
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
