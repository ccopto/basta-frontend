import { Injectable, NgZone } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

/**
 * SignalR connection state observable for the UI.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection | null = null;

  /** Observable connection state for the ConnectionStatus component. */
  private connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
  public connectionState$ = this.connectionStateSubject.asObservable();

  /** Tracks the currently joined game group to prevent redundant JoinGame calls. */
  public currentGameCode: string | null = null;

  constructor(private zone: NgZone) {}

  /**
   * Build and start the SignalR connection to the Basta hub.
   */
  async startConnection(): Promise<void> {
    if (this.hubConnection) {
      return;
    }

    this.hubConnection = this.buildConnection();

    this.registerConnectionEvents();

    try {
      this.connectionStateSubject.next('connecting');
      await this.hubConnection.start();
      this.connectionStateSubject.next('connected');
      console.log('[SignalR] Connected successfully.');
    } catch (err) {
      this.connectionStateSubject.next('disconnected');
      console.error('[SignalR] Connection failed:', err);
      throw err;
    }
  }

  /**
   * Internal factory method for the hub connection.
   * Overridden in tests to avoid HubConnectionBuilder dependency.
   */
  private buildConnection(): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}`)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Exponential backoff
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  /**
   * Stop the SignalR connection gracefully.
   */
  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionStateSubject.next('disconnected');
      console.log('[SignalR] Disconnected.');
    }
  }

  /**
   * Invoke a server-side hub method.
   * @param methodName The name of the hub method to call.
   * @param args Arguments to pass to the hub method.
   */
  async invoke<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
    if (!this.hubConnection) {
      throw new Error('[SignalR] No active connection. Call startConnection() first.');
    }
    return this.hubConnection.invoke<T>(methodName, ...args);
  }

  /**
   * Subscribe to a server-to-client event.
   * Returns a Subject that emits whenever the server broadcasts the given event.
   * Note: This assumes a single-consumer model. If multiple components listen to the 
   * same event simultaneously, registering a new handler will unregister the old one.
   * @param eventName The name of the SignalR event to listen for.
   */
  on<T>(eventName: string): Subject<T> {
    // Remove any previous handler to avoid duplicates (single-consumer assumption)
    this.hubConnection?.off(eventName);

    const subject = new Subject<T>();
    if (this.hubConnection) {
      this.hubConnection.on(eventName, (data: T) => {
        this.zone.run(() => {
          subject.next(data);
        });
      });
    }
    return subject;
  }

  /**
   * Remove a listener for a server-to-client event.
   * @param eventName The name of the SignalR event to stop listening for.
   */
  off(eventName: string): void {
    if (this.hubConnection) {
      this.hubConnection.off(eventName);
    }
  }

  /**
   * Submits self-validation results for the current round.
   * @param validations Dictionary of categoryId -> IsValid boolean.
   */
  async submitValidation(validations: { [categoryId: number]: boolean }): Promise<void> {
    return this.invoke('SubmitValidation', validations);
  }


  /**
   * Register internal connection lifecycle events.
   */
  private registerConnectionEvents(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting(() => {
      this.zone.run(() => {
        this.connectionStateSubject.next('reconnecting');
        console.warn('[SignalR] Reconnecting...');
      });
    });

    this.hubConnection.onreconnected(() => {
      this.zone.run(() => {
        this.connectionStateSubject.next('connected');
        console.log('[SignalR] Reconnected.');
      });
    });

    this.hubConnection.onclose(() => {
      this.zone.run(() => {
        this.connectionStateSubject.next('disconnected');
        console.warn('[SignalR] Connection closed.');
      });
    });
  }
}
