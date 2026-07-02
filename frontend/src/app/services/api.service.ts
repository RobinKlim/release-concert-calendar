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

export interface Concert {
  id: string;
  artist_mbid: string;
  artist_name?: string;
  event_name: string;
  venue: string;
  city: string;
  date: string;
  url: string;
  lat: number | null;
  lng: number | null;
}

export interface Album {
  id: string;
  artist_mbid: string;
  artist_name: string;
  title: string;
  rank: number | null;
  listening_needed: boolean;
  has_cover: boolean;
  year: number | null;
}

export interface GeoResult {
  name: string;
  lat: number;
  lng: number;
}

export interface ScanResult {
  message: string;
  artists: Artist[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly API_URL =
    window.location.port === '4200' ? 'http://localhost:3000/api' : `${window.location.origin}/api`;

  constructor(
    private http: HttpClient,
    private zone: NgZone,
  ) {}

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

  getAllConcerts(): Observable<Concert[]> {
    return this.http.get<Concert[]>(`${this.API_URL}/concerts`);
  }

  getUpcomingConcerts(): Observable<Concert[]> {
    return this.http.get<Concert[]>(`${this.API_URL}/concerts/upcoming`);
  }

  getArtistConcerts(mbid: string): Observable<Concert[]> {
    return this.http.get<Concert[]>(`${this.API_URL}/concerts/artist/${mbid}`);
  }

  fetchConcerts(): Observable<any> {
    return this.http.post(`${this.API_URL}/concerts/fetch`, {});
  }

  geocode(query: string): Observable<GeoResult[]> {
    return this.http.get<GeoResult[]>(`${this.API_URL}/geocode`, { params: { q: query } });
  }

  getSettings(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.API_URL}/settings`);
  }

  saveSettings(settings: Record<string, any>): Observable<Record<string, any>> {
    return this.http.put<Record<string, any>>(`${this.API_URL}/settings`, settings);
  }

  getAlbums(): Observable<Album[]> {
    return this.http.get<Album[]>(`${this.API_URL}/albums`);
  }

  albumCoverUrl(albumId: string): string {
    return `${this.API_URL}/albums/${albumId}/cover`;
  }

  saveRanking(
    ranked: string[],
    unranked: string[],
    listeningNeeded: string[],
  ): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.API_URL}/albums/ranking`, {
      ranked,
      unranked,
      listeningNeeded,
    });
  }

  listenToEvents(): Observable<{ mbid: string; name: string; type?: string }> {
    return new Observable((subscriber) => {
      const eventSource = new EventSource(`${this.API_URL}/events`);

      eventSource.addEventListener('artist-updated', (event: MessageEvent) => {
        this.zone.run(() => {
          subscriber.next({ ...JSON.parse(event.data), type: 'artist-updated' });
        });
      });

      eventSource.addEventListener('concerts-updated', (event: MessageEvent) => {
        this.zone.run(() => {
          subscriber.next({ ...JSON.parse(event.data), type: 'concerts-updated' });
        });
      });

      eventSource.addEventListener('scan-progress', (event: MessageEvent) => {
        this.zone.run(() => {
          subscriber.next({ ...JSON.parse(event.data), type: 'scan-progress' });
        });
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          subscriber.complete();
        }
      };

      return () => eventSource.close();
    });
  }
}
