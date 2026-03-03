import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ConcertsComponent } from './pages/concerts/concerts.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'concerts', component: ConcertsComponent },
  { path: 'settings', component: SettingsComponent }
];
