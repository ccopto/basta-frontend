import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionStatusComponent } from './connection-status';
import { SignalrService } from '../../services/signalr.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

describe('ConnectionStatusComponent', () => {
  let component: ConnectionStatusComponent;
  let fixture: ComponentFixture<ConnectionStatusComponent>;
  let connectionStateSubject: BehaviorSubject<string>;
  let mockSignalrService: any;

  beforeEach(async () => {
    connectionStateSubject = new BehaviorSubject<string>('disconnected');
    mockSignalrService = {
      connectionState$: connectionStateSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [ConnectionStatusComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SignalrService, useValue: mockSignalrService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render status badge retaining both status-badge and current status class', () => {
    // If [class]="s" is used, query by '.status-badge' will fail because the class status-badge gets overwritten.
    const badgeElement = fixture.nativeElement.querySelector('.status-container > div');
    expect(badgeElement).toBeTruthy();
    expect(badgeElement.classList.contains('status-badge')).toBeTrue();
    expect(badgeElement.classList.contains('disconnected')).toBeTrue();
  });
});
