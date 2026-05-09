import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { GameService } from '../../services/game.service';
import { PlayerStateService } from '../../services/player-state.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerState: jasmine.SpyObj<PlayerStateService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockGameService = jasmine.createSpyObj('GameService', ['createGame', 'joinGame']);
    mockPlayerState = jasmine.createSpyObj('PlayerStateService', ['updateState', 'clearState'], {
      currentState: { nickname: '', userId: 0, isHost: false, gameCode: null, language: 'en' }
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent, 
        ReactiveFormsModule, 
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerStateService, useValue: mockPlayerState },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid forms initially', () => {
    expect(component.gameForm.invalid).toBeTrue();
    expect(component.joinForm.invalid).toBeTrue();
  });

  it('should validate 4-character game code', () => {
    const gameCodeCtrl = component.joinForm.get('gameCode');
    
    gameCodeCtrl?.setValue('ABC');
    expect(gameCodeCtrl?.invalid).toBeTrue();
    
    gameCodeCtrl?.setValue('ABCD');
    expect(gameCodeCtrl?.valid).toBeTrue();
    
    gameCodeCtrl?.setValue('ABCDE');
    expect(gameCodeCtrl?.invalid).toBeTrue();
  });

  it('should call createGame and navigate on success', fakeAsync(() => {
    mockGameService.createGame.and.returnValue(of({ gameCode: 'ABCD', hostUserId: 1 }));
    
    component.gameForm.patchValue({
      nickname: 'Tester',
      language: 'en'
    });
    
    component.onCreateGame();
    tick();

    expect(mockGameService.createGame).toHaveBeenCalled();
    expect(mockPlayerState.updateState).toHaveBeenCalledWith(jasmine.objectContaining({
      gameCode: 'ABCD',
      userId: 1,
      isHost: true
    }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/lobby', 'ABCD']);
  }));

  it('should show error message on join failure', fakeAsync(() => {
    mockGameService.joinGame.and.returnValue(throwError(() => ({ message: 'Invalid code' })));
    
    component.showJoinForm = true;
    component.joinForm.patchValue({
      nickname: 'Joiner',
      gameCode: 'FAIL',
      language: 'en'
    });
    
    component.onJoinSubmit();
    tick();

    expect(component.errorMessage).toBe('Invalid code');
    expect(component.isLoading).toBeFalse();
  }));
});
