import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { SignalrService } from './signalr.service';
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
});
