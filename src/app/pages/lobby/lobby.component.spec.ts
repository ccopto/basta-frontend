import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LobbyComponent } from './lobby.component';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

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
    mockSignalr = jasmine.createSpyObj('SignalrService', ['startConnection', 'invoke', 'on', 'off', 'stopConnection', 'resetEvents']);
    mockPlayerState = jasmine.createSpyObj('PlayerStateService', ['clearState', 'updateState'], {
      currentState: { gameCode: 'ABCD', nickname: 'Host', userId: 1, isHost: true, hostUserId: 1 }
    });

    mockGameService = jasmine.createSpyObj('GameService', ['getGame']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockGameService.getGame.and.returnValue(of({
      gameCode: 'ABCD',
      players: [{ userId: 1, nickname: 'Host', isHost: true, isOnline: true }],
      language: 'en',
      totalRounds: 5,
      hostUserId: 1
    } as any));

    (mockSignalr.on as jasmine.Spy).and.callFake((event: string) => {
      if (event === 'ReceiveLobbyUpdate') return lobbyUpdateSubject;
      if (event === 'GameStarted') return gameStartedSubject;
      return new Subject<any>();
    });

    mockSignalr.startConnection.and.returnValue(Promise.resolve());
    mockSignalr.invoke.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [LobbyComponent, TranslateModule.forRoot()],
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

  it('should reset SignalR event buffers on destroy', () => {
    component.ngOnDestroy();
    expect(mockSignalr.resetEvents).toHaveBeenCalled();
    expect(mockSignalr.off).not.toHaveBeenCalled();
  });

  it('should preserve SignalR event buffers while navigating from lobby to game', fakeAsync(() => {
    tick();
    mockSignalr.resetEvents.calls.reset();

    gameStartedSubject.next();
    component.ngOnDestroy();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', 'ABCD']);
    expect(mockSignalr.resetEvents).not.toHaveBeenCalled();
  }));

  it('should display error message when getGame fails', fakeAsync(() => {
    // Override the mock for this test
    mockGameService.getGame.and.returnValue(throwError(() => ({ message: 'API Error' })));
    
    // Re-initialize component to trigger ngOnInit with the new mock
    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    
    expect(component.errorMessage).toBe('Could not fetch initial lobby state. Please try refreshing.');
    expect(component.lobbyState).toBeNull();
  }));

  it('should display total rounds correctly', () => {
    expect(component.lobbyState?.totalRounds).toBe(5);
  });

  it('should recover lobbyState from SignalR broadcast even when REST fails', fakeAsync(() => {
    // 1. Setup REST failure
    mockGameService.getGame.and.returnValue(throwError(() => ({ message: 'API Error' })));
    
    // Re-init
    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    
    expect(component.errorMessage).toBe('Could not fetch initial lobby state. Please try refreshing.');
    expect(component.lobbyState).toBeNull();

    // 2. Simulate SignalR broadcast recovery
    const recoverySnapshot = {
      gameCode: 'ABCD',
      players: [{ userId: 1, nickname: 'Host', isHost: true, isOnline: true }],
      totalRounds: 5,
      hostUserId: 1
    };
    
    lobbyUpdateSubject.next(recoverySnapshot);
    fixture.detectChanges();

    // 3. Assert recovery
    expect(component.lobbyState).not.toBeNull();
    expect(component.errorMessage).toBe(''); // Should be cleared
  }));

  it('should show error when both REST and SignalR have not responded yet', fakeAsync(() => {
    mockGameService.getGame.and.returnValue(throwError(() => ({ message: 'API Error' })));
    
    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    
    expect(component.errorMessage).toBe('Could not fetch initial lobby state. Please try refreshing.');
    expect(component.lobbyState).toBeNull();
    // No SignalR emit here
  }));

  it('should update PlayerState with hostUserId from initial REST snapshot', fakeAsync(() => {
    // Already triggered in beforeEach
    expect(mockPlayerState.updateState).toHaveBeenCalledWith(jasmine.objectContaining({ hostUserId: 1 }));
  }));

  it('should update PlayerState with language and selectedCategoryIds from ReceiveLobbyUpdate', fakeAsync(() => {
    tick();
    const updateSnapshot = {
      gameCode: 'ABCD',
      players: [{ userId: 1, nickname: 'Host', isHost: true, isOnline: true }],
      totalRounds: 5,
      hostUserId: 1,
      language: 'es',
      selectedCategoryIds: [1, 3]
    };
    
    lobbyUpdateSubject.next(updateSnapshot);
    fixture.detectChanges();

    expect(mockPlayerState.updateState).toHaveBeenCalledWith(jasmine.objectContaining({
      hostUserId: 1,
      language: 'es',
      selectedCategoryIds: [1, 3]
    }));
  }));
});
