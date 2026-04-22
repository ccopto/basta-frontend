import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LetterDisplayComponent } from './letter-display.component';
import { By } from '@angular/platform-browser';

describe('LetterDisplayComponent', () => {
  let component: LetterDisplayComponent;
  let fixture: ComponentFixture<LetterDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetterDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LetterDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the letter in the active display', () => {
    component.letter = 'B';
    fixture.detectChanges();
    const value = fixture.debugElement.query(By.css('.value')).nativeElement;
    expect(value.textContent).toBe('B');
  });

  it('should show overlay when showOverlay is true', () => {
    component.letter = 'G';
    component.showOverlay = true;
    fixture.detectChanges();
    
    const overlay = fixture.debugElement.query(By.css('.letter-overlay'));
    expect(overlay).toBeTruthy();
    const revealLetter = overlay.query(By.css('.reveal-letter')).nativeElement;
    expect(revealLetter.textContent).toBe('G');
  });

  it('should hide overlay when showOverlay is false', () => {
    component.showOverlay = false;
    fixture.detectChanges();
    
    const overlay = fixture.debugElement.query(By.css('.letter-overlay'));
    expect(overlay).toBeFalsy();
  });
});
