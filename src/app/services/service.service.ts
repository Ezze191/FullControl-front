import { Injectable } from '@angular/core';
import { ServiceModel } from '../interfaces/service.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IP } from '../assets/config';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {

  
  private servicesActualizados = new BehaviorSubject<boolean>(false);
  servicesActualizados$ = this.servicesActualizados.asObservable();

  notificarActualizacion() {
    this.servicesActualizados.next(true);
  }

  private ApiUrl = `http://${IP}/Software_FullControl/FullControl_System/public/api/services/`

  constructor(private http: HttpClient) { }

  //obtener todos los servicios
  getServices(): Observable<ServiceModel[]> {
    const url = `${this.ApiUrl}all`
    return this.http.get<ServiceModel[]>(url)
  }

  //actualizar servicio
  updateService(id: number, data: Partial<ServiceModel>): Observable<ServiceModel> {
    const url = `${this.ApiUrl}update/${id}`
    return this.http.put<ServiceModel>(url, data);
  }

  //subir imagen
  uploadImage(formData: FormData): Observable<{ ruta: string }> {
    const url = `${this.ApiUrl}subirImagen`
    return this.http.post<{ ruta: string }>(url, formData)
  }

  //eliminar servicio
  deleteService(id: number) {
    const url = `${this.ApiUrl}delete/${id}`
    return this.http.delete(url)
  }

  //crear un nuevo servicio
  addService(service: Partial<ServiceModel>): Observable<ServiceModel> {
    const url = `${this.ApiUrl}insert`
    return this.http.post<ServiceModel>(url, service)
  }

  //obtener un servicio mediante id
  findbyid(id: number): Observable<ServiceModel> {
    const url = `${this.ApiUrl}findbyid/${id}`
    return this.http.get<ServiceModel>(url)
  }

  findbyName(name: string): Observable<ServiceModel[]> {
    const url = `${this.ApiUrl}findbyname/${name}`;
    return this.http.get<ServiceModel[]>(url)
  }

  cobrarService(id: number) {
    const url = `${this.ApiUrl}cobrar/${id}`
    return this.http.post(url, {})
  }
}
