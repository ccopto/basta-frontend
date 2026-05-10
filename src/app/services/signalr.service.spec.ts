import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { SignalrService, ConnectionState } from './signalr.service';
import * as signalR from '@microsoft/signalr';

describe('SignalrService', () => {
  let service: SignalrService;
  let mockHubConnection: jasmine.SpyObj<signalR.HubConnection>;

  beforeEach(() => {
    mockHubConnection = jasmine.createSpyObj('HubConnection', 
      ['start', 'stop', 'invoke', 'on', 'off', 'onreconnecting', 'onreconnected', 'onclose'],
      { state: signalR.HubConnectionState.Disconnected }
    );
    
    // Default returns for connection setup
    mockHubConnection.start.and.returnValue(Promise.resolve());
    mockHubConnection.stop.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [SignalrService]
    });
    service = TestBed.inject(SignalrService);

    // Mock the inner connection builder method
    spyOn<any>(service, 'buildConnection').and.returnValue(mockHubConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start connection successfully', async () => {
    await service.startConnection();
    expect(mockHubConnection.start).toHaveBeenCalled();
  });

  it('should track currentGameCode when calling JoinGame', async () => {
    mockHubConnection.invoke.and.returnValue(Promise.resolve());
    
    await service.startConnection();
    await service.invoke('JoinGame', 'ABCD', 1, 'Nick');
    
    expect(mockHubConnection.invoke).toHaveBeenCalledWith('JoinGame', 'ABCD', 1, 'Nick');
  });

  it('should stop connection on stopConnection()', async () => {
    await service.startConnection();
    await service.stopConnection();
    expect(mockHubConnection.stop).toHaveBeenCalled();
    expect(service.currentGameCode).toBeNull();
  });
  it('should emit received events inside NgZone', async () => {
    let emittedInsideZone = false;
    const zone = TestBed.inject(NgZone);
    
    // Setup listener
    await service.startConnection();
    const eventSubject = service.on<string>('TestEvent');
    
    // Capture the callback registered with SignalR
    const onSpy = mockHubConnection.on as jasmine.Spy;
    const callback = onSpy.calls.argsFor(0)[1];
    
    eventSubject.subscribe(() => {
      emittedInsideZone = NgZone.isInAngularZone();
    });
    
    // Simulate SignalR event firing OUTSIDE the zone (mocking library behavior)
    zone.runOutsideAngular(() => {
      callback('test data');
    });
    
    expect(emittedInsideZone).toBeTrue();
  });

  it('should return the same Subject on repeated on() calls for the same event', async () => {
    await service.startConnection();
    const s1 = service.on<string>('Foo');
    const s2 = service.on<string>('Foo');
    expect(s1).toBe(s2);
  });

  it('should not lose subscribers when on() is called again for the same event', async () => {
    let receivedValue = '';
    
    await service.startConnection();
    const s1 = service.on<string>('Foo');
    
    s1.subscribe(val => receivedValue = val);
    
    // Call on() again - in the current buggy implementation, this orphans s1
    service.on<string>('Foo');
    
    // Capture the callback registered with SignalR
    const onSpy = mockHubConnection.on as jasmine.Spy;
    const callback = onSpy.calls.mostRecent().args[1];
    
    callback('test data');
    
    expect(receivedValue).toBe('test data');
  });

  it('should clear _eventSubjects when resetEvents is called', async () => {
    await service.startConnection();
    
    // Register event
    const s1 = service.on<string>('Foo');
    
    service.resetEvents();
    
    // Request event again
    const s2 = service.on<string>('Foo');
    
    // Since we cleared it, s2 should be a new Subject, not the same as s1
    expect(s1).not.toBe(s2);
  });

  it('should clear replay buffer for new subscribers after resetEvents', async () => {
    await service.startConnection();
    const eventName = 'GameStarted';
    const s1 = service.on<any>(eventName);
    
    // Simulate event firing
    const onSpy = mockHubConnection.on as jasmine.Spy;
    const callback = onSpy.calls.argsFor(0)[1];
    callback('stale event');
    
    // Now call reset
    service.resetEvents();
    
    // Request event again
    const s2 = service.on<any>(eventName);
    
    // Subscribe to the new subject
    let received = false;
    s2.subscribe(() => received = true);
    
    expect(received).toBeFalse();
  });

  it('should re-register proactive listeners when connection is started', async () => {
    // 1. Call on() BEFORE startConnection() is called
    const eventName = 'LobbyUpdate';
    const subject = service.on<string>(eventName);
    
    let receivedData = '';
    subject.subscribe(data => receivedData = data);
    
    // At this point, hubConnection is null, so it couldn't have called hubConnection.on
    // Now start the connection
    await service.startConnection();
    
    // Now the connection is built, verify that the listener was registered
    const onSpy = mockHubConnection.on as jasmine.Spy;
    // Find the callback that was registered for 'LobbyUpdate'
    const callArgs = onSpy.calls.allArgs().find(args => args[0] === eventName);
    expect(callArgs).toBeDefined('Listener was not registered on the hubConnection');
    
    const callback = callArgs![1];
    
    // Simulate event firing from SignalR
    const zone = TestBed.inject(NgZone);
    zone.runOutsideAngular(() => {
      callback('sync success');
    });
    
    // Verify our proactive subscriber received the data
    expect(receivedData).toBe('sync success');
  });

  it('should update state to reconnecting', async () => {
    await service.startConnection();
    
    // Capture the callback
    const reconnectingSpy = mockHubConnection.onreconnecting as jasmine.Spy;
    const callback = reconnectingSpy.calls.argsFor(0)[0];
    
    let currentState: ConnectionState = 'connected';
    service.connectionState$.subscribe(s => currentState = s);
    
    TestBed.inject(NgZone).run(() => callback());
    expect(currentState).toBe('reconnecting');
  });

  it('should update state to connected after reconnection', async () => {
    await service.startConnection();
    
    const reconnectedSpy = mockHubConnection.onreconnected as jasmine.Spy;
    const callback = reconnectedSpy.calls.argsFor(0)[0];
    
    let currentState: ConnectionState = 'disconnected';
    service.connectionState$.subscribe(s => currentState = s);
    
    TestBed.inject(NgZone).run(() => callback());
    expect(currentState).toBe('connected');
  });

  it('should update state to disconnected on close', async () => {
    await service.startConnection();
    
    const closeSpy = mockHubConnection.onclose as jasmine.Spy;
    const callback = closeSpy.calls.argsFor(0)[0];
    
    let currentState: ConnectionState = 'connected';
    service.connectionState$.subscribe(s => currentState = s);
    
    TestBed.inject(NgZone).run(() => callback());
    expect(currentState).toBe('disconnected');
  });
});
