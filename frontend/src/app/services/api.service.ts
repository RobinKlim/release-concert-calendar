import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NgZone } from '@angular/core';

export interface Artist {
  mbid: string;
  name: string;

  last_updated?: number;
}

export interface Release {
  id: string;
  artist_mbid: string;
  artist_name?: string;
  title: string;
  type: string;
  date: string;
  year: number;
}

export interface ScanResult {
  message: string;
  artists: Artist[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

  constructor(private http: HttpClient, private zone: NgZone) {}

  scanDirectory(path: string): Observable<ScanResult> {
    return this.http.post<ScanResult>(`${this.API_URL}/scan`, { path });
  }

  getArtists(): Observable<Artist[]> {
    return this.http.get<Artist[]>(`${this.API_URL}/artists`);
  }

  getArtist(mbid: string): Observable<Artist> {
    return this.http.get<Artist>(`${this.API_URL}/artists/${mbid}`);
  }

  getAllReleases(): Observable<Release[]> {
    return this.http.get<Release[]>(`${this.API_URL}/releases`);
  }

  getUpcomingReleases(): Observable<Release[]> {
    return this.http.get<Release[]>(`${this.API_URL}/releases/upcoming`);
  }

  getArtistReleases(mbid: string): Observable<Release[]> {
    return this.http.get<Release[]>(`${this.API_URL}/releases/artist/${mbid}`);
  }

  fetchReleases(artistMbid?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/releases/fetch`, { artistMbid });
  }

  listenToEvents(): Observable<{ mbid: string; name: string }> {
    return new Observable(subscriber => {
      const eventSource = new EventSource(`${this.API_URL}/events`);

      eventSource.addEventListener('artist-updated', (event: MessageEvent) => {
        this.zone.run(() => {
          subscriber.next(JSON.parse(event.data));
        });
      });

      eventSource.onerror = () => {
        // Only complete if the connection is permanently closed.
        // Transient errors (readyState === CONNECTING) are handled
        // by EventSource's built-in reconnect.
        if (eventSource.readyState === EventSource.CLOSED) {
          subscriber.complete();
        }
      };

      return () => eventSource.close();
    });
  }
}
