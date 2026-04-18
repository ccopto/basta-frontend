import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { gameGuard } from './game.guard';
import { PlayerStateService } from '../services/player-state.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';

describe('gameGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let playerStateService: jasmine.SpyObj<PlayerStateService>;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    playerStateService = jasmine.createSpyObj('PlayerStateService', ['clearState'], {
      currentState: { gameCode: null, nickname: null, userId: null }
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: PlayerStateService, useValue: playerStateService }
      ]
    });
  });

  it('should allow activation if gameCode matches route and user is identified', () => {
    // Arrange
    Object.defineProperty(playerStateService, 'currentState', {
      get: () => ({ gameCode: 'ABCD', nickname: 'Nick', userId: 1 })
    });

    const route = { paramMap: convertToParamMap({ code: 'ABCD' }) } as any as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => gameGuard(route, state));

    // Assert
    expect(result).toBe(true);
  });

  it('should fail and redirect to home if gameCode mismatch', () => {
    // Arrange
    Object.defineProperty(playerStateService, 'currentState', {
      get: () => ({ gameCode: 'ABCD', nickname: 'Nick', userId: 1 })
    });
    router.createUrlTree.and.returnValue({} as any);

    const route = { paramMap: convertToParamMap({ code: 'XYZW' }) } as any as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => gameGuard(route, state));

    // Assert
    expect(playerStateService.clearState).toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/home']);
  });

  it('should fail if player state is empty', () => {
     // Arrange (default mock state is null)
     router.createUrlTree.and.returnValue({} as any);

     const route = { paramMap: convertToParamMap({ code: 'ABCD' }) } as any as ActivatedRouteSnapshot;
     const state = {} as RouterStateSnapshot;
 
     // Act
     const result = TestBed.runInInjectionContext(() => gameGuard(route, state));
 
     // Assert
     expect(playerStateService.clearState).toHaveBeenCalled();
     expect(router.createUrlTree).toHaveBeenCalledWith(['/home']);
  });
});
