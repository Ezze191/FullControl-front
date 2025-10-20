import { Injectable } from '@angular/core';
import { MaterialModel } from '../interfaces/material.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IP } from '../assets/config';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class MaterialsService {

  private materialActualizados = new BehaviorSubject<boolean>(false);
  materialActualizados$ = this.materialActualizados.asObservable();

  notificarActualizacion() {
    this.materialActualizados.next(true);
  }

  private ApiUrl = `http://${IP}/Software_FullControl/FullControl_System/public/api/materials/`

  constructor(private http: HttpClient) { }

  getMaterials(): Observable<MaterialModel[]> {
    const url = `${this.ApiUrl}materials`
    return this.http.get<MaterialModel[]>(url)
  }

  updateMaterials(id: number, data: Partial<MaterialModel>): Observable<MaterialModel> {
    const url = `${this.ApiUrl}update/${id}`
    return this.http.put<MaterialModel>(url, data)
  }

  deleteMaterial(id: number) {
    const url = `${this.ApiUrl}delete/${id}`
    return this.http.delete(url)
  }

  createMaterial(material: Partial<MaterialModel>): Observable<MaterialModel> {
    const url = `${this.ApiUrl}insert`
    return this.http.post<MaterialModel>(url, material)
  }

  uploadImage(formData: FormData): Observable<{ ruta: string }> {
    const url = `${this.ApiUrl}subirImagen`;
    return this.http.post<{ ruta: string }>(url, formData)
  }

  findbyName(name: string): Observable<MaterialModel[]> {
    const url = `${this.ApiUrl}buscarpornombre/${name}`;
    return this.http.get<MaterialModel[]>(url)
  }

}
