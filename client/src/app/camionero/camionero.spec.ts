import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CamioneroComponent } from './camionero.component';

describe('CamioneroComponent', () => {
  let component: CamioneroComponent;
  let fixture: ComponentFixture<CamioneroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamioneroComponent]
    })
   .compileComponents();

    fixture = TestBed.createComponent(CamioneroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});