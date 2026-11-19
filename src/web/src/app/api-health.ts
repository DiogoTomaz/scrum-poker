import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiHealth {
  private readonly http = inject(HttpClient);

  check(): Observable<boolean> {
    return this.http.get('/api/health', { responseType: 'text' }).pipe(
      timeout(5000),
      map((body) => body === 'Healthy'),
    );
  }
}
