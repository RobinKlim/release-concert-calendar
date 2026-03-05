import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Concert } from '../../services/api.service';
import { AmbientGlowComponent } from '../ambient-glow/ambient-glow.component';

@Component({
  selector: 'app-concert-table',
  standalone: true,
  imports: [CommonModule, AmbientGlowComponent],
  templateUrl: './concert-table.component.html'
})
export class ConcertTableComponent {
  @Input() concerts: Concert[] = [];
  @Input() showDaysUntil: boolean = true;

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  daysUntilConcert(dateString: string): string {
    if (!this.showDaysUntil) return '-';

    const concertDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    concertDate.setHours(0, 0, 0, 0);

    const diffTime = concertDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    return `${diffDays}`;
  }
}