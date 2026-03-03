import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AmbientGlowComponent } from '../ambient-glow/ambient-glow.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, AmbientGlowComponent],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  @Input() title: string = 'Release Calendar';

  constructor(private router: Router) {}

  navigateHome() {
    this.router.navigate(['/']);
  }
}
