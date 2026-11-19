import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiHealth } from './api-health';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly apiHealth = inject(ApiHealth);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly status = signal<'checking' | 'available' | 'unavailable'>('checking');

  constructor() {
    this.checkHealth();
  }

  protected checkHealth(): void {
    this.status.set('checking');
    this.apiHealth
      .check()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (healthy) => this.status.set(healthy ? 'available' : 'unavailable'),
        error: () => this.status.set('unavailable'),
      });
  }
}
