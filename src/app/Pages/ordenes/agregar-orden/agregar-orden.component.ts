import { Component, ViewChild, ElementRef } from '@angular/core';
import { OrdersModel } from '../../../interfaces/orders.model';
import { OrdersService } from '../../../services/orders.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-agregar-orden',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-orden.component.html',
  styleUrl: './agregar-orden.component.css'
})
export class AgregarOrdenComponent {
  materialForm: FormGroup;

  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private fb: FormBuilder, private orderservice: OrdersService) {
    this.materialForm = this.fb.group({
      date: ['', Validators.required],
      description: ['', Validators.required],
      customerName: ['', Validators.required],
      phoneNumber: [''],
      price: ['', Validators.required]
    });
  }


  saveOrder() {
    if (this.materialForm.valid) {
      const newOrder: Partial<OrdersModel> = {
        date : this.materialForm.value.date,
        description : this.materialForm.value.description,
        customerName : this.materialForm.value.customerName,
        phoneNumber : this.materialForm.value.phoneNumber || 0,
        price : this.materialForm.value.price

      };


      this.orderservice.Insertnew(newOrder).subscribe({
        next: (res) => {
          console.log('Orden agregado correctamente')

          // Mostrar toast
          this.toastMessage = 'Orden agregado correctamente';
          const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
            delay: 5000
          });
          toast.show();

          this.orderservice.notificarActualizacion();

        },
        error: (err) => {
          console.log('OCURRIO UN ERRRO AL AGREAR UNA ORDEN', err);

        }
      });

    }
  }
}
