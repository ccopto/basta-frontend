import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let mockSignalr: jasmine.SpyObj<SignalrService>;
  let mockPlayerState: jasmine.SpyObj<PlayerStateService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  
  const roundStartedSubject = new Subject<any>();
  const roundStoppedSubject = new Subject<any>();
  const lobbyUpdateSubject = new Subject<any>();

  beforeEach(async () => {
    mockSignalr = jasmine.createSpyObj('SignalrService', ['startConnection', 'invoke', 'on', 'off'], {
        currentGameCode: null
    });
    mockPlayerState = jasmine.createSpyObj('PlayerStateService', [], {
      currentState: { gameCode: 'ABCD', nickname: 'Nick', userId: 1 }
    });
    mockGameService = jasmine.createSpyObj('GameService', ['getGame', 'getCategories']);
    mockGameService.getCategories.and.returnValue(of([]));
    mockGameService.getGame.and.returnValue(of({ selectedCategoryIds: [] } as any));

    mockSignalr.on.and.callFake((event: string) => {
      if (event === 'RoundStarted') return roundStartedSubject;
      if (event === 'RoundStopped') return roundStoppedSubject;
      if (event === 'ReceiveLobbyUpdate') return lobbyUpdateSubject;
      return new Subject<any>();
    });

    mockSignalr.startConnection.and.returnValue(Promise.resolve());
    mockSignalr.invoke.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [GameComponent, FormsModule],
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
    
    // Set initial state for signals that might block actions
    component.roundActive.set(false);
    component.isLocked.set(false);

    // Initial detectChanges triggers ngOnInit (which is async)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize SignalR and join game on init', fakeAsync(() => {
    tick(); // Wait for async ngOnInit
    expect(mockSignalr.startConnection).toHaveBeenCalled();
    expect(mockSignalr.invoke).toHaveBeenCalledWith('JoinGame', 'ABCD', 1, 'Nick');
  }));

  it('should start timer when RoundStarted event is received', fakeAsync(() => {
    tick(); // Ensure ngOnInit awaits are finished
    
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
    expect(component.isRoundRunning).toBeTrue();
    
    // At t=0, text should be 00:10
    expect(component.timeRemainingText()).toBe('00:10');

    tick(5000); // Wait 5 seconds
    fixture.detectChanges();
    expect(component.timeRemainingText()).toBe('00:05');
    expect(component.timerProgress()).toBeGreaterThan(45); // Approximate due to millisecond jitter

    tick(6000); // Finish timer
    expect(component.isRoundRunning).toBeFalse();
    expect(component.timeRemainingText()).toBe('00:00');
  }));

  it('should stop timer and lock ui when RoundStopped event is received', fakeAsync(() => {
    // Start round first
    roundStartedSubject.next({ roundNumber: 1, letter: 'B', timerDuration: 60, serverTime: new Date().toISOString() });
    tick();
    fixture.detectChanges();
    expect(component.isRoundRunning).toBeTrue();

    // Stop round
    roundStoppedSubject.next({ callerNickname: 'P2' });
    tick();
    fixture.detectChanges();

    expect(component.isRoundRunning).toBeFalse();
    expect(component.isLocked()).toBeTrue();
    expect(mockSignalr.invoke).toHaveBeenCalledWith('SubmitAnswers', jasmine.any(Object));
  }));

  it('should call invoke Basta on callBasta()', fakeAsync(() => {
    component.roundActive.set(true);
    component.isLocked.set(false);
    
    component.callBasta();
    expect(mockSignalr.invoke).toHaveBeenCalledWith('CallBasta');
  }));
});

