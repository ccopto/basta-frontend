import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoundResultsComponent } from './round-results.component';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

describe('RoundResultsComponent', () => {
  let component: RoundResultsComponent;
  let fixture: ComponentFixture<RoundResultsComponent>;

  const mockCategories = [
    { categoryId: 1, name: 'Fruits' },
    { categoryId: 2, name: 'Animals' }
  ];

  const mockScores = [
    {
      userId: 1,
      nickname: 'Alice',
      roundScore: 15,
      cumulativeScore: 30,
      answers: [
        { categoryId: 1, answer: 'Apple', isValid: true, points: 10, isUnique: true },
        { categoryId: 2, answer: 'Bee', isValid: true, points: 5, isUnique: false }
      ]
    },
    {
      userId: 2,
      nickname: 'Bob',
      roundScore: 5,
      cumulativeScore: 20,
      answers: [
        { categoryId: 1, answer: 'Apricot', isValid: false, points: 0, isUnique: false },
        { categoryId: 2, answer: 'Bee', isValid: true, points: 5, isUnique: false }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundResultsComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RoundResultsComponent);
    component = fixture.componentInstance;
    component.categories = mockCategories;
    component.scores = mockScores as any;
    component.currentUserId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render player nicknames and scores', () => {
    const cards = fixture.debugElement.queryAll(By.css('.player-result-card'));
    expect(cards.length).toBe(2);
    
    expect(cards[0].query(By.css('.nickname')).nativeElement.textContent).toContain('Alice');
    expect(cards[0].query(By.css('.round-pts')).nativeElement.textContent).toContain('+15 pts');
    expect(cards[0].query(By.css('.total-pts')).nativeElement.textContent).toContain('30');
  });

  it('should apply invalid style to wrong answers', () => {
    // Bob's first answer (index 1 in cards, index 0 in answers)
    const bobCard = fixture.debugElement.queryAll(By.css('.player-result-card'))[1];
    const invalidAns = bobCard.query(By.css('.answer-text.invalid'));
    expect(invalidAns.nativeElement.textContent).toContain('Apricot');
  });

  it('should apply unique/shared styles to points badges', () => {
    const aliceCard = fixture.debugElement.queryAll(By.css('.player-result-card'))[0];
    const badges = aliceCard.queryAll(By.css('.pts-badge'));
    
    expect(badges[0].nativeElement.classList).toContain('unique');
    expect(badges[1].nativeElement.classList).toContain('shared');
  });

  it('should only show next round button if isHost is true', () => {
    component.isHost = false;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.btn-primary'))).toBeNull();
    const paragraphs = fixture.debugElement.queryAll(By.css('.results-container p'));
    const waitingMsg = paragraphs.find(p => p.nativeElement.textContent.includes('WAITING_FOR_HOST'));
    expect(waitingMsg).toBeTruthy();

    component.isHost = true;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.btn-primary'))).toBeTruthy();
  });

  it('should emit onNextRound when button clicked', () => {
    component.isHost = true;
    fixture.detectChanges();
    spyOn(component.onNextRound, 'emit');
    
    const btn = fixture.debugElement.query(By.css('.btn-primary')).nativeElement;
    btn.click();
    
    expect(component.onNextRound.emit).toHaveBeenCalled();
  });
});
