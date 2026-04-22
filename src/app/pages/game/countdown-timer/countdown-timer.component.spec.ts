import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CountdownTimerComponent } from './countdown-timer.component';

describe('CountdownTimerComponent', () => {
  let component: CountdownTimerComponent;
  let fixture: ComponentFixture<CountdownTimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountdownTimerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CountdownTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate correct remaining time from server timestamp', fakeAsync(() => {
    const now = Date.now();
    const serverTime = new Date(now).toISOString();
    const duration = 60;
    
    component.serverTime = serverTime;
    component.durationSec = duration;
    component.ngOnChanges({
      serverTime: { currentValue: serverTime, previousValue: '', firstChange: true, isFirstChange: () => true },
      durationSec: { currentValue: duration, previousValue: 0, firstChange: true, isFirstChange: () => true }
    });
    
    fixture.detectChanges();
    expect(component.timeRemainingText()).toBe('01:00');

    tick(10000); // 10 seconds pass
    fixture.detectChanges();
    expect(component.timeRemainingText()).toBe('00:50');
    expect(component.timerProgress()).toBeCloseTo(83.33, 1);
    
    component.ngOnDestroy();
  }));

  it('should emit expired when time reaches zero', fakeAsync(() => {
    const spy = spyOn(component.expired, 'emit');
    const now = Date.now();
    const serverTime = new Date(now).toISOString();
    const duration = 5;
    
    component.serverTime = serverTime;
    component.durationSec = duration;
    component.ngOnChanges({
      serverTime: { currentValue: serverTime, previousValue: '', firstChange: true, isFirstChange: () => true },
      durationSec: { currentValue: duration, previousValue: 0, firstChange: true, isFirstChange: () => true }
    });

    tick(5000);
    expect(spy).toHaveBeenCalled();
    
    component.ngOnDestroy();
  }));
});
