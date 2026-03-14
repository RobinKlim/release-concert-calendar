import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

interface Toast {
  id: number;
  name: string;
  type: string;
  state: 'entering' | 'visible' | 'leaving';
}

@Component({
  selector: 'app-update-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-toast.component.html',
  styleUrl: './update-toast.component.css'
})
export class UpdateToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sseSub?: Subscription;
  private nextId = 0;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sseSub = this.apiService.listenToEvents().subscribe(event => {
      if (event.type === 'scan-progress') {
        const status = (event as any).status;
        this.addToast(event.name, status === 'resolved' ? 'scan-resolved' : 'scan-failed');
      } else if (event.name && typeof event.name === 'string' && event.name.trim().length > 0) {
        this.addToast(event.name, event.type || 'artist-updated');
      }
    });
  }

  ngOnDestroy() {
    this.sseSub?.unsubscribe();
  }

  private addToast(name: string, type: string) {
    const id = this.nextId++;
    const toast: Toast = { id, name, type, state: 'entering' };
    this.toasts.push(toast);
    this.cdr.detectChanges();

    // Transition to visible after browser has painted the entering state
    requestAnimationFrame(() => {
      toast.state = 'visible';
      this.cdr.detectChanges();
    });

    // Start leaving
    setTimeout(() => {
      toast.state = 'leaving';
      this.cdr.detectChanges();
    }, 3000);

    // Remove from DOM
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.cdr.detectChanges();
    }, 3500);
  }

  getEmoji(type: string): string {
    if (type === 'concerts-updated') return '\uD83C\uDFB8';
    if (type === 'scan-resolved') return '\u2705';
    if (type === 'scan-failed') return '\u274C';
    return '\uD83D\uDCBF';
  }

  getLabel(type: string): string {
    if (type === 'concerts-updated') return 'Concerts';
    if (type === 'scan-resolved') return 'Resolved';
    if (type === 'scan-failed') return 'Failed to resolve';
    return 'Releases';
  }
}
