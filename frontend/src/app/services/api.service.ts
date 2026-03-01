import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Artist {
  mbid: string;
  name: string;
  track_count: number;
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

  constructor(private http: HttpClient) {}

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
}
