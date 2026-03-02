import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Release } from '../../services/api.service';

@Component({
  selector: 'app-release-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './release-table.component.html'
})
export class ReleaseTableComponent {
  @Input() releases: Release[] = [];
  @Input() showDaysUntil: boolean = true;

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  daysUntilRelease(dateString: string): string {
    if (!this.showDaysUntil) return '-';

    const releaseDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    releaseDate.setHours(0, 0, 0, 0);

    const diffTime = releaseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    return `${diffDays}`;
  }
}
