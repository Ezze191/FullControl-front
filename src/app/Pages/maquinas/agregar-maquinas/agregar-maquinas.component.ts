import { Component, ViewChild, ElementRef } from '@angular/core';
import { MaterialModel } from '../../../interfaces/material.model';
import { MaterialsService } from '../../../services/materials.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-agregar-maquinas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agregar-maquinas.component.html',
  styleUrl: './agregar-maquinas.component.css'
})
export class AgregarMaquinasComponent {
  materialForm: FormGroup;
  urlImageMode: boolean = false;

  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';

  constructor(private fb: FormBuilder, private materialservice: MaterialsService) {
    this.materialForm = this.fb.group({
      name: ['', Validators.required],
      existence: ['', Validators.required],
      price: ['', Validators.required],
      supplier: ['', Validators.required],
      buyLink: [''],
      lastIncome: ['', Validators.required],
      imagePath: [''],
    });
  }

  imgPath: string = '';

  toggleImageMode() {
    this.urlImageMode = !this.urlImageMode;
    this.materialForm.patchValue({ imagePath: '' });
    this.imgPath = '';
  }

  selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('imagen', file);

      this.materialservice.uploadImage(formData).subscribe({
        next: (res) => {
          this.imgPath = res.ruta;
          this.materialForm.patchValue({ imagePath: res.ruta });
          console.log('ruta de imagen guardada', this.imgPath);

        },
        error: (err) => {
          console.error('error al subir imagen', err);
        }
      });
    }
  }


  saveMaterial() {
    if (this.materialForm.valid) {
      const newProduct: Partial<MaterialModel> = {
        name: this.materialForm.value.name,
        existence: this.materialForm.value.existence,
        price: this.materialForm.value.price,
        supplier: this.materialForm.value.supplier,
        buyLink: this.materialForm.value.buyLink || 'URL',
        lastIncome: this.materialForm.value.lastIncome,
        imagePath: this.materialForm.value.imagePath || 'URL'

      };


      this.materialservice.createMaterial(newProduct).subscribe({
        next: (res) => {
          console.log('Material agregado correctamente')

          // Mostrar toast
          this.toastMessage = 'Material agregado correctamente';
          const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
            delay: 5000
          });
          toast.show();

          this.imgPath = '';
          this.materialForm.reset();
          this.urlImageMode = false;

          this.materialservice.notificarActualizacion();

        },
        error: (err) => {
          console.log('OCURRIO UN ERRRO AL AGREAR EL Material', err);

        }
      });

    }
  }

}
