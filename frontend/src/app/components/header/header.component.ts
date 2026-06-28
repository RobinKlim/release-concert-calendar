import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AmbientGlowComponent } from '../ambient-glow/ambient-glow.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AmbientGlowComponent],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  navItems = [
    { label: 'Releases', path: '/', exact: true },
    { label: 'Concerts', path: '/concerts', exact: false },
    { label: 'Artists', path: '/artists', exact: false },
    { label: 'Albums', path: '/library', exact: false },
  ];
}
