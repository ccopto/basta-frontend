import { ComponentFixture, TestBed, fakeAsync, tick, flush, waitForAsync } from '@angular/core/testing';
import { GameSetupComponent } from './game-setup.component';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

describe('GameSetupComponent', () => {
  let component: GameSetupComponent;
  let fixture: ComponentFixture<GameSetupComponent>;
  let mockSignalr: jasmine.SpyObj<SignalrService>;
  let mockPlayerState: jasmine.SpyObj<PlayerStateService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const gameStartedSubject = new Subject<void>();

  beforeEach(async () => {
    mockSignalr = jasmine.createSpyObj('SignalrService', ['startConnection', 'invoke', 'on', 'off']);
    mockPlayerState = jasmine.createSpyObj('PlayerStateService', ['updateState'], {
      currentState: { gameCode: 'ABCD', nickname: 'Host', userId: 1, isHost: true }
    });
    mockGameService = jasmine.createSpyObj('GameService', ['getGame', 'getCategories']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockGameService.getGame.and.returnValue(of({
      gameCode: 'ABCD',
      totalRounds: 5,
      timerDuration: 60
    } as any));

    mockGameService.getCategories.and.returnValue(of([
      { categoryId: 1, name: 'Fruits' },
      { categoryId: 2, name: 'Animals' }
    ]));

    (mockSignalr.on as jasmine.Spy).and.callFake((event: string) => {
      if (event === 'GameStarted') return gameStartedSubject;
      return new Subject<any>();
    });

    mockSignalr.startConnection.and.returnValue(Promise.resolve());
    mockSignalr.invoke.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [GameSetupComponent],
      providers: [
        { provide: SignalrService, useValue: mockSignalr },
        { provide: PlayerStateService, useValue: mockPlayerState },
        { provide: GameService, useValue: mockGameService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    expect(mockGameService.getGame).toHaveBeenCalled();
    expect(mockGameService.getCategories).toHaveBeenCalled();
    expect(component.availableCategories.length).toBe(2);
  });

  it('should toggle categories', () => {
    component.toggleCategory(1);
    expect(component.selectedCategoryIds.has(1)).toBeTrue();
    
    component.toggleCategory(1);
    expect(component.selectedCategoryIds.has(1)).toBeFalse();
  });

  it('should invoke UpdateGameSettings and StartGame on success', fakeAsync(() => {
    component.toggleCategory(2);
    component.onStartGame();
    tick();

    expect(mockSignalr.invoke).toHaveBeenCalledWith('UpdateGameSettings', 5, 60, [2]);
    expect(mockSignalr.invoke).toHaveBeenCalledWith('StartGame');
    expect(mockPlayerState.updateState).toHaveBeenCalledWith({ 
      selectedCategoryIds: [2],
      totalRounds: 5,
      timerDuration: 60
    });
  }));


  it('should navigate away when GameStarted received', waitForAsync(async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    gameStartedSubject.next();
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/game', 'ABCD']);
  }));

  it('should update rounds within range', () => {
    // Default is 5 (from mockGameService.getGame)
    expect(component.totalRounds()).toBe(5);
    
    component.updateRounds(1); // Increment
    expect(component.totalRounds()).toBe(6);
    
    component.updateRounds(-1); // Decrement
    expect(component.totalRounds()).toBe(5);
  });

  it('should update timer within range', () => {
    // Default is 60
    expect(component.timerDuration()).toBe(60);
    
    component.updateTimer(30); // Increment
    expect(component.timerDuration()).toBe(90);
    
    component.updateTimer(-30); // Decrement
    expect(component.timerDuration()).toBe(60);
  });

  it('should call UpdateGameSettings with custom rounds and timer when starting game', fakeAsync(() => {
    component.toggleCategory(1);
    component.totalRounds.set(10);
    component.timerDuration.set(45);
    
    component.onStartGame();
    tick();

    expect(mockSignalr.invoke).toHaveBeenCalledWith('UpdateGameSettings', 10, 45, [1]);
    expect(mockSignalr.invoke).toHaveBeenCalledWith('StartGame');
  }));

});
