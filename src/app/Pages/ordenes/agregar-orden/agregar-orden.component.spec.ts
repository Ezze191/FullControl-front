import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarOrdenComponent } from './agregar-orden.component';

describe('AgregarOrdenComponent', () => {
  let component: AgregarOrdenComponent;
  let fixture: ComponentFixture<AgregarOrdenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarOrdenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarOrdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
