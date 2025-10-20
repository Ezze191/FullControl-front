import { Injectable } from '@angular/core';
import { Ventas } from '../interfaces/ventas.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IP } from '../assets/config';
@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private ApiUrl = `http://${IP}/Software_FullControl/FullControl_System/public/api/`

  constructor(private http: HttpClient) { }

  //obtener todas las ventas
  getVentas(): Observable<Ventas[]>{
    const url = `${this.ApiUrl}Ventas`
    return this.http.get<Ventas[]>(url)
  }
  
}
