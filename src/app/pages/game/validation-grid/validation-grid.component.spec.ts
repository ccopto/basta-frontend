import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationGridComponent } from './validation-grid.component';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

describe('ValidationGridComponent', () => {
  let component: ValidationGridComponent;
  let fixture: ComponentFixture<ValidationGridComponent>;

  const mockCategories = [
    { categoryId: 1, name: 'Fruits' },
    { categoryId: 2, name: 'Animals' }
  ];

  /** Both answers require peer review — the grid should render them */
  const mockScoringData = {
    players: [
      {
        userId: 1,
        nickname: 'Alice',
        answers: [
          { answerId: 10, categoryId: 1, answer: 'Apple',   dictionaryValid: false, requiresPeerReview: true },
          { answerId: 11, categoryId: 2, answer: 'Ant',     dictionaryValid: false, requiresPeerReview: true }
        ]
      },
      {
        userId: 2,
        nickname: 'Bob',
        answers: [
          { answerId: 20, categoryId: 1, answer: 'Apricot', dictionaryValid: false, requiresPeerReview: true },
          { answerId: 21, categoryId: 2, answer: 'Bee',     dictionaryValid: false, requiresPeerReview: true }
        ]
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationGridComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ValidationGridComponent);
    component = fixture.componentInstance;
    component.categories = mockCategories;
    component.scoringData = mockScoringData as any;
    component.currentUserId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize validations as true for all peer-review categories', () => {
    expect(component.validations[1]).toBeTrue();
    expect(component.validations[2]).toBeTrue();
  });

  it('should show peer-review categories in header', () => {
    const headers = fixture.debugElement.queryAll(By.css('thead th'));
    // 1 Player column + 2 category columns
    expect(headers.length).toBe(3);
  });

  it('should toggle validation state when button clicked', () => {
    const toggleBtn = fixture.debugElement.query(By.css('.toggle-btn')).nativeElement;
    toggleBtn.click();
    expect(component.validations[1]).toBeFalse();

    toggleBtn.click();
    expect(component.validations[1]).toBeTrue();
  });

  it('should only show toggle buttons for current user answers', () => {
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));

    // Alice's row (ID 1 = currentUserId)
    const aliceToggles = rows[0].queryAll(By.css('.toggle-btn'));
    expect(aliceToggles.length).toBe(2);

    // Bob's row (ID 2 — not current user)
    const bobToggles = rows[1].queryAll(By.css('.toggle-btn'));
    expect(bobToggles.length).toBe(0);
  });

  it('should emit validations on submit', () => {
    spyOn(component.onValidated, 'emit');
    component.toggleValidation(1); // Set category 1 to false

    const submitBtn = fixture.debugElement.query(By.css('.btn-primary')).nativeElement;
    submitBtn.click();

    expect(component.onValidated.emit).toHaveBeenCalledWith({
      1: false,
      2: true
    });
  });

  it('should disable submit button when isSubmitting is true', () => {
    component.isSubmitting = true;
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(By.css('.btn-primary')).nativeElement;
    expect(submitBtn.disabled).toBeTrue();
  });

  it('should show auto-validated notice when no answers require peer review', () => {
    component.scoringData = {
      players: [
        {
          userId: 1,
          nickname: 'Alice',
          answers: [
            { answerId: 1, categoryId: 1, answer: 'Apple', dictionaryValid: true, requiresPeerReview: false }
          ]
        }
      ]
    } as any;
    fixture.detectChanges();

    const notice = fixture.debugElement.query(By.css('.auto-validated-notice'));
    expect(notice).toBeTruthy();

    const table = fixture.debugElement.query(By.css('.validation-table'));
    expect(table).toBeNull();
  });
});
