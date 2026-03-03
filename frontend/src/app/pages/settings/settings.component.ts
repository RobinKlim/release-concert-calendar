import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Artist } from '../../services/api.service';
import { HeaderComponent } from '../../components/header/header.component';
import { PageContainer } from '../../components/page-container/page-container';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, PageContainer],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  selectedSection = signal<'music-library' | 'concerts' | 'style'>('music-library');
  
  navigationItems = [
    { id: 'music-library' as const, label: 'Music Library Path', isLast: false },
    { id: 'concerts' as const, label: 'Concerts', isLast: false },
    { id: 'style' as const, label: 'Style', isLast: true }
  ];
  
  directoryPath = signal('');
  scanning = signal(false);
  error = signal('');
  success = signal('');
  artists = signal<Artist[]>([]);
  showArtists = signal(false);

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load saved path from localStorage if available
    const savedPath = localStorage.getItem('musicLibraryPath');
    if (savedPath) {
      this.directoryPath.set(savedPath);
    }
    
    // Load artists
    this.loadArtists();
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

  toggleArtists() {
    this.showArtists.set(!this.showArtists());
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
        this.success.set(`Found ${result.artists.length} artists`);
        
        // Save path to localStorage
        localStorage.setItem('musicLibraryPath', this.directoryPath());
        
        // Reload artists
        this.loadArtists();
      },
      error: (err) => {
        this.scanning.set(false);
        this.error.set(err.error?.error || 'Error scanning directory');
      }
    });
  }
}
