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

  const mockScoringData = {
    players: [
      {
        userId: 1,
        nickname: 'Alice',
        answers: { 1: 'Apple', 2: 'Ant' }
      },
      {
        userId: 2,
        nickname: 'Bob',
        answers: { 1: 'Apricot', 2: 'Bee' }
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

  it('should initialize validations as true for all categories', () => {
    expect(component.validations[1]).toBeTrue();
    expect(component.validations[2]).toBeTrue();
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
    
    // Alice's row (ID 1)
    const aliceToggles = rows[0].queryAll(By.css('.toggle-btn'));
    expect(aliceToggles.length).toBe(2);
    
    // Bob's row (ID 2)
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
});
