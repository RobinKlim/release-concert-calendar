import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VinylSpinnerComponent } from '../vinyl-spinner/vinyl-spinner.component';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, VinylSpinnerComponent],
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.css',
})
export class LoadingOverlay {
  @Input() show: boolean = false;
}
