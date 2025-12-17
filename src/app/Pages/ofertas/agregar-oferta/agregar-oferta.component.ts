import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OfertasService } from '../../../services/ofertas.service';

@Component({
    selector: 'app-agregar-oferta',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './agregar-oferta.component.html',
    styleUrl: './agregar-oferta.component.css'
})
export class AgregarOfertaComponent {
    @Output() offerAdded = new EventEmitter<void>();
    ofertaForm: FormGroup;
    urlImageMode: boolean = false;
    imgPath: string = '';

    constructor(
        private fb: FormBuilder,
        private ofertasService: OfertasService
    ) {
        this.ofertaForm = this.fb.group({
            NOMBRE: ['', Validators.required],
            DESCRIPCION: [''],
            PRECIO: [0, [Validators.required, Validators.min(0)]],
            EXISTENCIA: [0, [Validators.required, Validators.min(0)]],
            FECHA_INICIO: [''],
            FECHA_FIN: [''],
            IMAGE_PATH: [''],
            PLU: [this.generarPLU(), Validators.required]
        });
    }

    generarPLU(): number {
        const randomPLU = Math.floor(10000000 + Math.random() * 90000000);
        return randomPLU;
    }

    generarPLUAleatorio() {
        this.ofertaForm.patchValue({ PLU: this.generarPLU() });
    }

    toggleImageMode() {
        this.urlImageMode = !this.urlImageMode;
        this.ofertaForm.patchValue({ IMAGE_PATH: '' });
        this.imgPath = '';
    }

    onFileSelected(event: any) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            this.ofertasService.uploadImage(file).subscribe({
                next: (res) => {
                    this.imgPath = res.ruta;
                    this.ofertaForm.patchValue({ IMAGE_PATH: res.ruta });
                },
                error: (err) => console.error('Error uploading image', err)
            });
        }
    }

    saveOferta() {
        if (this.ofertaForm.valid) {
            const newOferta = {
                ...this.ofertaForm.value,
                IMAGE_PATH: this.ofertaForm.value.IMAGE_PATH || 'URL'
            };

            this.ofertasService.createOferta(newOferta).subscribe({
                next: () => {
                    this.offerAdded.emit();
                    this.ofertaForm.reset({
                        PLU: this.generarPLU(),
                        PRECIO: 0,
                        EXISTENCIA: 0
                    });
                    this.imgPath = '';
                },
                error: (err) => console.error('Error saving oferta', err)
            });
        }
    }
}
