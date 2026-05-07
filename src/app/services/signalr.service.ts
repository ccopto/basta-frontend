import { Injectable, NgZone } from '@angular/core';
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';
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
  private startConnectionPromise: Promise<void> | null = null;

  /** Observable connection state for the ConnectionStatus component. */
  private connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
  public connectionState$ = this.connectionStateSubject.asObservable();

  /** Tracks the currently joined game group to prevent redundant JoinGame calls. */
  public currentGameCode: string | null = null;

  /** Registry of Subjects per event name to ensure stability and multi-consumer support. */
  private readonly _eventSubjects = new Map<string, Subject<any>>();

  /** Set of event names that have been registered with the underlying HubConnection.on() */
  private registeredHubMethods = new Set<string>();

  constructor(private zone: NgZone) {
    if (!environment.production) {
      if (!(window as any).basta_mock_signalr) {
          (window as any).basta_mock_signalr = { trigger: () => {} };
      }
      
      (window as any).basta_mock_signalr.trigger = (eventName: string, data: any) => {
          this.zone.run(() => {
            const subject = this._eventSubjects.get(eventName);
            if (subject) {
              subject.next(data);
            } else {
              console.warn(`[SignalR Mock App] No subject registered for ${eventName}`);
            }
          });
      };
    }
  }

  /**
   * Resets all registered event subjects.
   * Useful when leaving a game session to prevent stale transient events (like GameStarted)
   * from replaying instantly upon re-joining a new session.
   */
  public resetEvents(): void {
    // Complete existing subjects to cleanly un-subscribe current listeners
    this._eventSubjects.forEach(subject => subject.complete());
    this._eventSubjects.clear();
  }

  /**
   * Build and start the SignalR connection to the Basta hub.
   */
  async startConnection(): Promise<void> {
    if (this.startConnectionPromise) {
      return this.startConnectionPromise;
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }

    this.startConnectionPromise = this.internalStartConnection();
    try {
      await this.startConnectionPromise;
    } finally {
      this.startConnectionPromise = null;
    }
  }

  private async internalStartConnection(): Promise<void> {
    if (!this.hubConnection) {
      this.hubConnection = this.buildConnection();
      this.registerConnectionEvents();
      
      // Re-register any listeners that were requested before the connection was built
      this._eventSubjects.forEach((subject, eventName) => {
        if (!this.registeredHubMethods.has(eventName)) {
          this.hubConnection!.on(eventName, (data: any) => {
            this.zone.run(() => {
              subject.next(data);
            });
          });
          this.registeredHubMethods.add(eventName);
        }
      });
    }

    if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

    try {
      this.zone.run(() => this.connectionStateSubject.next('connecting'));
      await this.hubConnection.start();
      this.zone.run(() => this.connectionStateSubject.next('connected'));
    } catch (err) {
      this.zone.run(() => this.connectionStateSubject.next('disconnected'));
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
      this.resetEvents();
      this.connectionStateSubject.next('disconnected');
    }
  }

  /**
   * Invoke a server-side hub method.
   * @param methodName The name of the hub method to call.
   * @param args Arguments to pass to the hub method.
   */
   async invoke<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
    if (!this.hubConnection) {
      console.error('[SignalR] Invoke failed: No active connection.', { methodName, args });
      throw new Error('[SignalR] No active connection. Call startConnection() first.');
    }
    try {
      const result = await this.hubConnection.invoke<T>(methodName, ...args);
      return result;
    } catch (err) {
      console.error(`[SignalR] Invoke ${methodName} FAILED:`, err);
      throw err;
    }
  }

  /**
   * Subscribe to a server-to-client event.
   * Returns a stable Subject that emits whenever the server broadcasts the given event.
   * Multiple calls for the same eventName will return the same Subject instance.
   * @param eventName The name of the SignalR event to listen for.
   */
  on<T>(eventName: string): Subject<T> {
    if (!this._eventSubjects.has(eventName)) {
      this._eventSubjects.set(eventName, new ReplaySubject<any>(1));
    }
    const subject = this._eventSubjects.get(eventName)!;

    if (this.hubConnection && !this.registeredHubMethods.has(eventName)) {
      this.hubConnection.on(eventName, (data: T) => {
        this.zone.run(() => {
          subject.next(data);
        });
      });
      this.registeredHubMethods.add(eventName);
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
