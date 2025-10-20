import { Producto } from './../interfaces/producto.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IP } from '../assets/config';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private productosActualizados = new BehaviorSubject<boolean>(false);
  productosActualizados$ = this.productosActualizados.asObservable();

  notificarActualizacion() {
    this.productosActualizados.next(true);
  }

  
  private ApiUrl = `http://${IP}/Software_FullControl/FullControl_System/public/api/`
  
  constructor(private http: HttpClient) { }

  //obtener los productos
  getProductos(): Observable<Producto[]> {
    const url = `${this.ApiUrl}Productos`
    return this.http.get<Producto[]>(url)
  }

  //actualizar productos

  updateProducto(id: number, data: Partial<Producto>): Observable<Producto> {
    const url = `${this.ApiUrl}actualizar/${id}`;
    return this.http.put<Producto>(url, data);
  }

  //subir imagen
  uploadImage(formData: FormData): Observable<{ ruta: string }> {
    const url = `${this.ApiUrl}Producto/ActualizarIMG`;
    return this.http.post<{ ruta: string }>(url, formData)
  }

  //eliminar producto mediante id
  deleteProducto(id: number) {
    const url = `${this.ApiUrl}eliminar/${id}`
    return this.http.delete(url)
  }


  //crear un nuevo producto:
  addProducto(prodcuto: Partial<Producto>): Observable<Producto> {
    const url = `${this.ApiUrl}InsertarProducto`;
    return this.http.post<Producto>(url, prodcuto);
  }

  //obtener producto mediante el codigo del producto:
  findPlu(plu: number): Observable<Producto> {
    const url = `${this.ApiUrl}ProductoPLU/${plu}`;
    return this.http.get<Producto>(url)
  }

  findbyName(name : string) : Observable<Producto[]>{
    const url = `${this.ApiUrl}ProductoNombre/${name}`;
    return this.http.get<Producto[]>(url)
  }


  //cobrar un producto
  cobrarProducto(id: number, unidades: number) {
    const url = `${this.ApiUrl}cobrar/${id}/${unidades}`
    return this.http.post(url, {})
  }
}
