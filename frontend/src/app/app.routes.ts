import { Routes } from '@angular/router';
import { ReleasesComponent } from './pages/releases/releases.component';
import { ConcertsComponent } from './pages/concerts/concerts.component';
import { ArtistsComponent } from './pages/artists/artists.component';

export const routes: Routes = [
  { path: '', component: ReleasesComponent },
  { path: 'concerts', component: ConcertsComponent },
  { path: 'artists', component: ArtistsComponent }
];
