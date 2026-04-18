import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LobbyComponent } from './lobby.component';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

describe('LobbyComponent', () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;
  let mockSignalr: jasmine.SpyObj<SignalrService>;
  let mockPlayerState: jasmine.SpyObj<PlayerStateService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const lobbyUpdateSubject = new Subject<any>();
  const gameStartedSubject = new Subject<void>();

  beforeEach(async () => {
    mockSignalr = jasmine.createSpyObj('SignalrService', ['startConnection', 'invoke', 'on', 'off', 'stopConnection']);
    mockPlayerState = jasmine.createSpyObj('PlayerStateService', ['clearState'], {
      currentState: { gameCode: 'ABCD', nickname: 'Host', userId: 1, isHost: true }
    });
    mockGameService = jasmine.createSpyObj('GameService', ['getGame']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockGameService.getGame.and.returnValue(of({
      gameCode: 'ABCD',
      players: [{ userId: 1, nickname: 'Host', isHost: true, isOnline: true }],
      language: 'en',
      targetScore: 50
    } as any));

    (mockSignalr.on as jasmine.Spy).and.callFake((event: string) => {
      if (event === 'ReceiveLobbyUpdate') return lobbyUpdateSubject;
      if (event === 'GameStarted') return gameStartedSubject;
      return new Subject<any>();
    });

    mockSignalr.startConnection.and.returnValue(Promise.resolve());
    mockSignalr.invoke.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [LobbyComponent],
      providers: [
        { provide: SignalrService, useValue: mockSignalr },
        { provide: PlayerStateService, useValue: mockPlayerState },
        { provide: GameService, useValue: mockGameService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize connection and join hub group', fakeAsync(() => {
    tick();
    expect(mockSignalr.startConnection).toHaveBeenCalled();
    expect(mockSignalr.invoke).toHaveBeenCalledWith('JoinGame', 'ABCD', 1, 'Host');
  }));

  it('should update lobby state when SignalR event received', fakeAsync(() => {
    tick();
    const newState = {
      gameCode: 'ABCD',
      players: [
        { userId: 1, nickname: 'Host', isHost: true, isOnline: true },
        { userId: 2, nickname: 'Player2', isHost: false, isOnline: true }
      ],
      language: 'es'
    };

    lobbyUpdateSubject.next(newState);
    fixture.detectChanges();

    expect(component.lobbyState?.players.length).toBe(2);
    expect(component.lobbyState?.language).toBe('es');
  }));

  it('should navigate to game when GameStarted received', fakeAsync(() => {
    tick();
    gameStartedSubject.next();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', 'ABCD']);
  }));

  it('should cleanup SignalR on destroy', () => {
    // Manually trigger some registrations
    (component as any).registeredEvents = ['Ev1', 'Ev2'];
    component.ngOnDestroy();
    expect(mockSignalr.off).toHaveBeenCalledWith('Ev1');
    expect(mockSignalr.off).toHaveBeenCalledWith('Ev2');
  });
});
