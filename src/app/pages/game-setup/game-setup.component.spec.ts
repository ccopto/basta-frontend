import { ComponentFixture, TestBed, fakeAsync, tick, flush, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GameSetupComponent } from './game-setup.component';
import { SignalrService } from '../../services/signalr.service';
import { PlayerStateService } from '../../services/player-state.service';
import { GameService } from '../../services/game.service';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

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
      currentState: { gameCode: 'ABCD', nickname: 'Host', userId: 1, isHost: true, language: 'en' }
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
      imports: [GameSetupComponent, TranslateModule.forRoot()],
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
    expect(mockGameService.getCategories).toHaveBeenCalledWith('en');
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

    expect(mockSignalr.invoke).toHaveBeenCalledWith('UpdateGameSettings', 5, 60, [2], 'en');
    expect(mockSignalr.invoke).toHaveBeenCalledWith('StartGame');
    expect(mockPlayerState.updateState).toHaveBeenCalledWith({
      selectedCategoryIds: [2],
      totalRounds: 5,
      timerDuration: 60,
      language: 'en'
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

    expect(mockSignalr.invoke).toHaveBeenCalledWith('UpdateGameSettings', 10, 45, [1], 'en');
    expect(mockSignalr.invoke).toHaveBeenCalledWith('StartGame');
  }));

  it('should not update rounds outside min/max range', () => {
    // Min is 1
    component.totalRounds.set(1);
    component.updateRounds(-1);
    expect(component.totalRounds()).toBe(1);
    
    // Max is 20
    component.totalRounds.set(20);
    component.updateRounds(1);
    expect(component.totalRounds()).toBe(20);
  });

  it('should not update timer outside min/max range', () => {
    // Min is 30
    component.timerDuration.set(30);
    component.updateTimer(-15);
    expect(component.timerDuration()).toBe(30);
    
    // Max is 120
    component.timerDuration.set(120);
    component.updateTimer(15);
    expect(component.timerDuration()).toBe(120);
  });

  it('should disable Start Game button if no categories selected', () => {
    component.selectedCategoryIds.clear();
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.btn-primary')).nativeElement;
    expect(btn.disabled).toBeTrue();
  });

  it('should initialize language from game snapshot and fetch categories in that language', () => {
    // Reset call counters
    mockGameService.getGame.calls.reset();
    mockGameService.getCategories.calls.reset();

    mockGameService.getGame.and.returnValue(of({
      gameCode: 'ABCD',
      totalRounds: 5,
      timerDuration: 60,
      language: 'es'
    } as any));

    component.ngOnInit();

    expect(component.gameLanguage()).toBe('es');
    expect(mockGameService.getCategories).toHaveBeenCalledWith('es');
  });

  it('should reload categories and filter out invalid selected category IDs on setLanguage', () => {
    component.selectedCategoryIds = new Set([1, 2]);
    component.availableCategories = [
      { categoryId: 1, name: 'Fruits' },
      { categoryId: 2, name: 'Animals' }
    ];

    // mock return of only category 1 in Spanish
    mockGameService.getCategories.and.returnValue(of([
      { categoryId: 1, name: 'Frutas' }
    ]));

    component.setLanguage('es');

    expect(component.gameLanguage()).toBe('es');
    expect(mockGameService.getCategories).toHaveBeenCalledWith('es');
    expect(component.availableCategories).toEqual([{ categoryId: 1, name: 'Frutas' }]);
    expect(component.selectedCategoryIds.has(1)).toBeTrue();
    expect(component.selectedCategoryIds.has(2)).toBeFalse(); // 2 is filtered out because it is not in Spanish list
  });

  it('should pass gameLanguage as fourth argument to UpdateGameSettings', fakeAsync(() => {
    component.toggleCategory(1);
    component.gameLanguage.set('es');
    mockSignalr.invoke.calls.reset();

    component.onStartGame();
    tick();

    expect(mockSignalr.invoke).toHaveBeenCalledWith('UpdateGameSettings', 5, 60, [1], 'es');
  }));
  it('should initialize selected categories from game snapshot', fakeAsync(() => {
    mockGameService.getGame.and.returnValue(of({
      gameCode: 'ABCD',
      totalRounds: 5,
      timerDuration: 60,
      language: 'en',
      selectedCategoryIds: [1]
    } as any));

    fixture = TestBed.createComponent(GameSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component.selectedCategoryIds.has(1)).toBeTrue();
  }));

  it('should enable Start Game when snapshot already has selected categories', fakeAsync(() => {
    mockGameService.getGame.and.returnValue(of({
      gameCode: 'ABCD',
      totalRounds: 5,
      timerDuration: 60,
      language: 'en',
      selectedCategoryIds: [1]
    } as any));

    fixture = TestBed.createComponent(GameSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const startButton = fixture.debugElement.query(By.css('[data-testid="setup-start-game"]')).nativeElement;
    expect(startButton.disabled).toBeFalse();
  }));
});
