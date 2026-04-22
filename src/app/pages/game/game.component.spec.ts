import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LetterDisplayComponent } from './letter-display/letter-display.component';
import { CountdownTimerComponent } from './countdown-timer/countdown-timer.component';
import { AnswerGridComponent } from './answer-grid/answer-grid.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let mockSignalr: jasmine.SpyObj<SignalrService>;
  let mockPlayerState: jasmine.SpyObj<PlayerStateService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  
  const roundStartedSubject = new Subject<any>();
  const roundStoppedSubject = new Subject<any>();
  const lobbyUpdateSubject = new Subject<any>();
  const gameOverSubject = new Subject<string>();

  beforeEach(async () => {
    mockSignalr = jasmine.createSpyObj('SignalrService', ['startConnection', 'invoke', 'on', 'off'], {
        currentGameCode: null
    });
    mockPlayerState = jasmine.createSpyObj('PlayerStateService', [], {
      currentState: { gameCode: 'ABCD', nickname: 'Nick', userId: 1, selectedCategoryIds: [1] }
    });
    mockGameService = jasmine.createSpyObj('GameService', ['getGame', 'getCategories']);
    mockGameService.getCategories.and.returnValue(of([{ categoryId: 1, name: 'Name' }]));
    mockGameService.getGame.and.returnValue(of({ selectedCategoryIds: [1] } as any));

    mockSignalr.on.and.callFake(((event: string) => {
      if (event === 'RoundStarted') return roundStartedSubject;
      if (event === 'RoundStopped') return roundStoppedSubject;
      if (event === 'ReceiveLobbyUpdate') return lobbyUpdateSubject;
      if (event === 'GameOver') return gameOverSubject;
      return new Subject<any>();
    }) as any);


    mockSignalr.startConnection.and.returnValue(Promise.resolve());
    mockSignalr.invoke.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [GameComponent, FormsModule, LetterDisplayComponent, CountdownTimerComponent, AnswerGridComponent],
      providers: [
        { provide: SignalrService, useValue: mockSignalr },
        { provide: PlayerStateService, useValue: mockPlayerState },
        { provide: GameService, useValue: mockGameService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'ABCD' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    
    component.roundActive.set(false);
    component.isLocked.set(false);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize SignalR and join game on init', fakeAsync(() => {
    tick();
    expect(mockSignalr.startConnection).toHaveBeenCalled();
    expect(mockSignalr.invoke).toHaveBeenCalledWith('JoinGame', 'ABCD', 1, 'Nick');
  }));

  it('should update state when RoundStarted event is received', fakeAsync(() => {
    tick();
    
    const now = Date.now();
    const roundData = {
      roundNumber: 1,
      letter: 'A',
      timerDuration: 10,
      serverTime: new Date(now).toISOString()
    };

    roundStartedSubject.next(roundData);
    tick(); 
    fixture.detectChanges();

    expect(component.currentLetter()).toBe('A');
    expect(component.roundNumber()).toBe(1);
    expect(component.serverTime()).toBe(roundData.serverTime);
    expect(component.timerDuration()).toBe(10);
    expect(component.isRoundRunning).toBeTrue();
  }));

  it('should lock ui and submit answers when RoundStopped event is received', fakeAsync(() => {
    roundStartedSubject.next({ roundNumber: 1, letter: 'B', timerDuration: 60, serverTime: new Date().toISOString() });
    tick();
    fixture.detectChanges();

    roundStoppedSubject.next({ callerNickname: 'P2' });
    tick();
    fixture.detectChanges();

    expect(component.isRoundRunning).toBeFalse();
    expect(component.isLocked()).toBeTrue();
    expect(mockSignalr.invoke).toHaveBeenCalledWith('SubmitAnswers', jasmine.any(Object));
  }));

  it('should handle GameOver event', fakeAsync(() => {
    spyOn(window, 'alert');
    gameOverSubject.next('No more letters');
    tick();
    fixture.detectChanges();

    expect(component.isRoundRunning).toBeFalse();
    expect(component.isLocked()).toBeTrue();
    expect(window.alert).toHaveBeenCalledWith('Game Over: No more letters');
  }));

  it('should call invoke CallBasta on callBasta()', fakeAsync(() => {
    component.roundActive.set(true);
    component.isLocked.set(false);
    
    component.callBasta();
    expect(mockSignalr.invoke).toHaveBeenCalledWith('CallBasta');
  }));
});
