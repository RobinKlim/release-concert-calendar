import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ambient-glow',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-[-50%] right-[10%] w-[300px] h-[200px] rounded-full bg-amber-700/25 blur-[40px]"></div>
      <div class="absolute top-[-30%] left-[10%] w-[400px] h-[150px] rounded-full bg-amber-500/35 blur-[50px]"></div>
    </div>
  `
})
export class AmbientGlowComponent {}
