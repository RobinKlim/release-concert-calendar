import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styles: [`
    .vinyl {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #1a1a1a;
      position: relative;
      animation: spin 4s linear infinite;
    }
    .vinyl .groove {
      position: absolute;
      border-radius: 50%;
      border: 1px solid transparent;
      border-top-color: #333;
    }
    .vinyl .groove-1 {
      top: 6px; left: 6px; right: 6px; bottom: 6px;
    }
    .vinyl .groove-2 {
      top: 11px; left: 11px; right: 11px; bottom: 11px;
      transform: rotate(90deg);
    }
    .vinyl .groove-3 {
      top: 16px; left: 16px; right: 16px; bottom: 16px;
      transform: rotate(180deg);
    }
    .vinyl-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      background: #1a1a1a;
      border: 2px solid #333;
      border-radius: 50%;
    }
    .vinyl-reflection {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class HeaderComponent {
  @Input() title: string = 'Release Calendar';
}
