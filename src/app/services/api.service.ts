import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Base API service for all HTTP communication with the Basta backend.
 * Wraps Angular HttpClient with the correct base URL from the environment.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Perform a GET request.
   * @param path Relative API path (e.g. '/games/ABC123')
   */
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`);
  }

  /**
   * Perform a POST request.
   * @param path Relative API path (e.g. '/games')
   * @param body Request body payload
   */
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  /**
   * Perform a PUT request.
   * @param path Relative API path
   * @param body Request body payload
   */
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  /**
   * Perform a DELETE request.
   * @param path Relative API path
   */
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}
