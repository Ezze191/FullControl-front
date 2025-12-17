import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Oferta } from '../interfaces/oferta.model';
import { IP } from '../assets/config';

@Injectable({
    providedIn: 'root'
})
export class OfertasService {

    private apiUrl = `http://${IP}/Software_FullControl/FullControl_System/public/api`;

    constructor(private http: HttpClient) { }

    getOfertas(): Observable<Oferta[]> {
        return this.http.get<Oferta[]>(`${this.apiUrl}/Ofertas`);
    }

    findPlu(plu: number): Observable<Oferta> {
        return this.http.get<Oferta>(`${this.apiUrl}/Ofertaplu/${plu}`);
    }

    findbyName(name: string): Observable<Oferta[]> {
        return this.http.get<Oferta[]>(`${this.apiUrl}/OfertaName/${name}`);
    }

    createOferta(oferta: Partial<Oferta>): Observable<Oferta> {
        return this.http.post<Oferta>(`${this.apiUrl}/InsertarOferta`, oferta);
    }

    updateOferta(id: number, oferta: Partial<Oferta>): Observable<Oferta> {
        return this.http.put<Oferta>(`${this.apiUrl}/actualizarOferta/${id}`, oferta);
    }

    deleteOferta(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/eliminarOferta/${id}`);
    }

    uploadImage(image: File): Observable<{ ruta: string }> {
        const formData = new FormData();
        formData.append('image', image);
        return this.http.post<{ ruta: string }>(`${this.apiUrl}/SubirImagenOferta`, formData);
    }

    cobrarOferta(id: number, unidades: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/CobrarOferta/${id}/${unidades}`, {});
    }
}
