import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarMaquinasComponent } from './agregar-maquinas.component';

describe('AgregarMaquinasComponent', () => {
  let component: AgregarMaquinasComponent;
  let fixture: ComponentFixture<AgregarMaquinasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarMaquinasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarMaquinasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
