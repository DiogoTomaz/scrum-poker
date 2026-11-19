import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('Application service connection', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows the project name and disables retry while checking', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Scrum Poker');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Checking',
    );
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    const request = http.expectOne('/api/health');
    expect(request.request.method).toBe('GET');
    request.flush('Healthy');
  });

  it('shows availability after the expected health response', () => {
    http.expectOne('/api/health').flush('Healthy');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Service available.',
    );
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
  });

  it('shows an actionable error when the service fails', () => {
    http
      .expectOne('/api/health')
      .flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Start the API and try again.',
    );
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
  });

  it('does not treat an unexpected successful response as healthy', () => {
    http.expectOne('/api/health').flush('<html>not the API</html>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Service unavailable.',
    );
  });

  it('allows a user to retry after a failed connection', () => {
    http.expectOne('/api/health').error(new ProgressEvent('error'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    http.expectOne('/api/health').flush('Healthy');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Service available.',
    );
  });

  it('times out a stalled connection and enables retry', async () => {
    // RxJS schedules timeout with setInterval. Keep Angular's render timers real.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      http.expectOne('/api/health').flush('Healthy');
      fixture.detectChanges();
      fixture.nativeElement.querySelector('button').click();
      const request = http.expectOne('/api/health');
      await vi.advanceTimersByTimeAsync(5000);
      fixture.detectChanges();
      expect(request.cancelled).toBe(true);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        'Service unavailable.',
      );
      expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
