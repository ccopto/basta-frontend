import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnswerGridComponent } from './answer-grid.component';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

describe('AnswerGridComponent', () => {
  let component: AnswerGridComponent;
  let fixture: ComponentFixture<AnswerGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnswerGridComponent, ReactiveFormsModule, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AnswerGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render correct number of inputs based on categories', () => {
    component.categories = [
      { categoryId: 1, name: 'Name' },
      { categoryId: 2, name: 'Animal' }
    ];
    component.ngOnChanges({
      categories: { 
        currentValue: component.categories, 
        previousValue: [], 
        firstChange: true, 
        isFirstChange: () => true 
      }
    });
    fixture.detectChanges();

    const inputs = fixture.debugElement.queryAll(By.css('input'));
    expect(inputs.length).toBe(2);
  });

  it('should emit answersChanged when form values change', () => {
    const spy = spyOn(component.answersChanged, 'emit');
    component.categories = [{ categoryId: 1, name: 'Name' }];
    component.ngOnChanges({
      categories: { 
        currentValue: component.categories, 
        previousValue: [], 
        firstChange: true, 
        isFirstChange: () => true 
      }
    });
    
    const control = component.form.get('1') as FormControl;
    control.setValue('Apple');
    
    expect(spy).toHaveBeenCalled();
    const lastEmit = spy.calls.mostRecent().args[0];
    expect(lastEmit!['1']).toBe('Apple');

  });

  it('should disable form when isLocked is true', () => {
    component.categories = [{ categoryId: 1, name: 'Name' }];
    component.ngOnChanges({
      categories: { 
        currentValue: component.categories, 
        previousValue: [], 
        firstChange: true, 
        isFirstChange: () => true 
      }
    });
    
    component.isLocked = true;
    component.ngOnChanges({
      isLocked: { 
        currentValue: true, 
        previousValue: false, 
        firstChange: false, 
        isFirstChange: () => false 
      }
    });
    fixture.detectChanges();

    expect(component.form.disabled).toBeTrue();

    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(input.disabled).toBeTrue();
  });

  it('should render localized placeholder', () => {
    component.categories = [{ categoryId: 1, name: 'Name' }];
    component.currentLetter = 'A';
    component.ngOnChanges({
      categories: { 
        currentValue: component.categories, 
        previousValue: [], 
        firstChange: true, 
        isFirstChange: () => true 
      }
    });
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement;
    expect(input.placeholder).toBeTruthy();
  });
});
