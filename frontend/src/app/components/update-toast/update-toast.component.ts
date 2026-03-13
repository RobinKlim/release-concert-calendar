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
      if (event.name && typeof event.name === 'string' && event.name.trim().length > 0) {
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
    return type === 'concerts-updated' ? '\uD83C\uDFB8' : '\uD83D\uDCBF';
  }

  getLabel(type: string): string {
    return type === 'concerts-updated' ? 'Concerts' : 'Releases';
  }
}
