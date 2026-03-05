import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Artist } from '../../services/api.service';
import { HeaderComponent } from '../../components/header/header.component';
import { PageContainer } from '../../components/page-container/page-container';

@Component({
  selector: 'app-artists',
  standalone: true,
  imports: [CommonModule, HeaderComponent, PageContainer],
  templateUrl: './artists.component.html'
})
export class ArtistsComponent implements OnInit {
  directoryPath = signal('');
  scanning = signal(false);
  error = signal('');
  success = signal('');
  artists = signal<Artist[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    const savedPath = localStorage.getItem('musicLibraryPath');
    if (savedPath) {
      this.directoryPath.set(savedPath);
    }
    this.loadArtists();
  }

  loadArtists() {
    this.apiService.getArtists().subscribe({
      next: (artists) => this.artists.set(artists),
      error: (err) => console.error('Error loading artists:', err)
    });
  }

  scanDirectory() {
    if (!this.directoryPath()) {
      this.error.set('Please enter a directory path');
      return;
    }

    this.scanning.set(true);
    this.error.set('');
    this.success.set('');

    this.apiService.scanDirectory(this.directoryPath()).subscribe({
      next: (result) => {
        this.scanning.set(false);
        this.success.set('done');
        setTimeout(() => this.success.set(''), 2000);
        localStorage.setItem('musicLibraryPath', this.directoryPath());
        this.loadArtists();
      },
      error: (err) => {
        this.scanning.set(false);
        this.error.set(err.error?.error || 'Error scanning directory');
      }
    });
  }
}
