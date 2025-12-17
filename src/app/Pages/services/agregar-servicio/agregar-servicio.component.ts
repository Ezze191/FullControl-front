import { Component, ViewChild, ElementRef } from '@angular/core';
import { ServiceModel } from '../../../interfaces/service.model';
import { ServiceService } from '../../../services/service.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-agregar-servicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agregar-servicio.component.html',
  styleUrl: './agregar-servicio.component.css'
})
export class AgregarServicioComponent {
  ServiceForm: FormGroup;
  urlImageMode: boolean = false;

  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private fb: FormBuilder, private serviceService: ServiceService) {
    this.ServiceForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      commission: ['', Validators.required],
      imagePath: [''],
    });
  }

  imgPath: string = '';

  toggleImageMode() {
    this.urlImageMode = !this.urlImageMode;
    this.ServiceForm.patchValue({ imagePath: '' });
    this.imgPath = '';
  }

  selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('image', file);

      this.serviceService.uploadImage(formData).subscribe({
        next: (res) => {
          this.imgPath = res.ruta;
          this.ServiceForm.patchValue({ imagePath: res.ruta });
          console.log('ruta de imagen guardada', this.imgPath);

        },
        error: (err) => {
          console.error('error al subir imagen', err);
        }
      });
    }
  }

  saveService() {
    if (this.ServiceForm.valid) {
      const newService: Partial<ServiceModel> = {
        name: this.ServiceForm.value.name,
        description: this.ServiceForm.value.description,
        commission: this.ServiceForm.value.commission,
        imagePath: this.ServiceForm.value.imagePath || 'URL'

      };


      this.serviceService.addService(newService).subscribe({
        next: (res) => {
          console.log('Servicio agregado correctamente')

          // Mostrar toast
          this.toastMessage = 'Servicio agregado correctamente';
          const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
            delay: 5000
          });
          toast.show();

          this.imgPath = '';
          this.ServiceForm.reset();
          this.urlImageMode = false;

          this.serviceService.notificarActualizacion();

        },
        error: (err) => {
          console.log('OCURRIO UN ERRRO AL AGREAR EL SERVICIO', err);

        }
      });

    }
  }


}
