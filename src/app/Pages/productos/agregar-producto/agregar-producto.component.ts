import { Component , ViewChild , ElementRef} from '@angular/core';
import { Producto } from '../../../interfaces/producto.model';
import { ProductosService } from '../../../services/productos.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-agregar-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-producto.component.html',
  styleUrl: './agregar-producto.component.css'
})
export class AgregarProductoComponent {
 productForm : FormGroup;


  @ViewChild('toastElement') toastElement!: ElementRef;
  toastMessage: string = '';
 
 constructor(private fb : FormBuilder , private productoservice : ProductosService, private router : Router ){
  this.productForm = this.fb.group({
    PLU : ['', Validators.required],
    NOMBRE : ['', Validators.required],
    EXISTENCIA : ['', Validators.required],
    PRECIO_COMPRA : ['', Validators.required],
    PRECIO_VENTA : ['', Validators.required],
    PROVEDOR : ['', Validators.required],
    ULTIMO_INGRESO : ['', Validators.required],
    IMAGE_PATH: ['']
  });
 }


 imgPath : string = '';

 selectFile(event : Event){
  const input  = event.target as HTMLInputElement;
  if(input.files && input.files.length > 0){
    const file = input.files[0];
    const formData = new FormData();
    formData.append('imagen' , file);

    this.productoservice.uploadImage(formData).subscribe({
      next: (res) => {
        this.imgPath = res.ruta;
        console.log('ruta de imagen guardada' , this.imgPath);

      },
      error : (err) => {
        console.error('error al subir imagen' , err);
      }
    });
  }
 }




 saveProduct(){
  if(this.productForm.valid){
    const newProduct : Partial<Producto>={
      PLU : this.productForm.value.PLU,
      NOMBRE : this.productForm.value.NOMBRE,
      EXISTENCIA : this.productForm.value.EXISTENCIA,
      PRECIO_COMPRA : this.productForm.value.PRECIO_COMPRA,
      PRECIO_VENTA : this.productForm.value.PRECIO_VENTA,
      PROVEDOR : this.productForm.value.PROVEDOR,
      ULTIMO_INGRESO : this.productForm.value.ULTIMO_INGRESO,
      IMAGE_PATH : this.imgPath || 'URL'
    };

    

    this.productoservice.addProducto(newProduct).subscribe({
      next : (res) => {
        console.log('prodcuto agregado correctamente')

         // Mostrar toast
        this.toastMessage = 'Producto agregado correctamente';
        const toast = new bootstrap.Toast(this.toastElement.nativeElement, {
          delay: 5000
        });
        toast.show();

        this.imgPath = '';

        this.productoservice.notificarActualizacion();
        
      },
      error : (err) => {
        console.log('OCURRIO UN ERRRO AL AGREAR EL PRODUCTO' , err);
        
      }
    });

  }
 }

}
