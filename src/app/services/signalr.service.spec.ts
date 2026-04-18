import { TestBed } from '@angular/core/testing';
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
});
