import { ProductoTemporada } from './../interfaces/producto-temporada.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IP } from '../assets/config';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProductosTemporadaService {

    private productosActualizados = new BehaviorSubject<boolean>(false);
    productosActualizados$ = this.productosActualizados.asObservable();

    notificarActualizacion() {
        this.productosActualizados.next(true);
    }

    private ApiUrl = `http://${IP}/Software_FullControl/FullControl_System/public/api/`

    constructor(private http: HttpClient) { }

    //obtener los productos
    getProductos(): Observable<ProductoTemporada[]> {
        const url = `${this.ApiUrl}ProductosTemporada`
        return this.http.get<ProductoTemporada[]>(url)
    }

    //actualizar productos
    updateProducto(id: number, data: Partial<ProductoTemporada>): Observable<ProductoTemporada> {
        const url = `${this.ApiUrl}actualizarProductoTemporada/${id}`;
        return this.http.put<ProductoTemporada>(url, data);
    }

    //subir imagen - Reusing the same endpoint logic, pointing to the specific router
    uploadImage(formData: FormData): Observable<{ ruta: string }> {
        const url = `${this.ApiUrl}ProductoTemporada/ActualizarIMG`;
        return this.http.post<{ ruta: string }>(url, formData)
    }

    //eliminar producto mediante id
    deleteProducto(id: number) {
        const url = `${this.ApiUrl}eliminarProductoTemporada/${id}`
        return this.http.delete(url)
    }

    //crear un nuevo producto:
    addProducto(prodcuto: Partial<ProductoTemporada>): Observable<ProductoTemporada> {
        const url = `${this.ApiUrl}InsertarProductoTemporada`;
        return this.http.post<ProductoTemporada>(url, prodcuto);
    }

    //obtener producto mediante el codigo del producto:
    findPlu(plu: number): Observable<ProductoTemporada> {
        const url = `${this.ApiUrl}ProductoTemporadaPLU/${plu}`;
        return this.http.get<ProductoTemporada>(url)
    }

    findbyName(name: string): Observable<ProductoTemporada[]> {
        const url = `${this.ApiUrl}ProductoTemporadaNombre/${name}`;
        return this.http.get<ProductoTemporada[]>(url)
    }

    //cobrar un producto
    cobrarProducto(id: number, unidades: number) {
        const url = `${this.ApiUrl}cobrarProductoTemporada/${id}/${unidades}`
        return this.http.post(url, {})
    }
}
