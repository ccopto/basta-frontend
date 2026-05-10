import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameOverComponent } from './game-over.component';
import { Router, ActivatedRoute } from '@angular/router';
import { GameResultsService } from '../../services/game-results.service';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

describe('GameOverComponent', () => {
  let component: GameOverComponent;
  let fixture: ComponentFixture<GameOverComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let gameResultsService: GameResultsService;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [GameOverComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'ABCD' } }
          }
        },
        GameResultsService
      ]
    }).compileComponents();

    gameResultsService = TestBed.inject(GameResultsService);
    fixture = TestBed.createComponent(GameOverComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to home if no leaderboard data is present', () => {
    gameResultsService.clearResults();
    fixture.detectChanges(); // Trigger ngOnInit

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should display leaderboard reason when data is present', () => {
    const mockData = {
      reason: 'All rounds finished',
      players: [
        { userId: 1, nickname: 'Winner', cumulativeScore: 100, rank: 1 }
      ]
    };
    gameResultsService.setResults(mockData);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')?.textContent).toContain('All rounds finished');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
