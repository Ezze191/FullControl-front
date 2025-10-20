import { Injectable } from '@angular/core';
import { OrdersModel } from '../interfaces/orders.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IP } from '../assets/config';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private ordersActualizados = new BehaviorSubject<boolean>(false);
  ordersActualizados$ = this.ordersActualizados.asObservable();

  notificarActualizacion() {
    this.ordersActualizados.next(true);
  }

  private ApiUrl = `http://${IP}/Software_FullControl/FullControl_System/public/api/orders/`

  constructor(private http: HttpClient) { }

  //obtiene solamente las que no estan terminadas
  getOrders(): Observable<OrdersModel[]> {
    const url = `${this.ApiUrl}orders`
    return this.http.get<OrdersModel[]>(url)
  }

  //obtener todas las ordenes

  getAllOrders(): Observable<OrdersModel[]> {
    const url = `${this.ApiUrl}all`
    return this.http.get<OrdersModel[]>(url)
  }

  //obtener solamente las que estan termiandas

  getOlnyFinished(): Observable<OrdersModel[]> {
    const url = `${this.ApiUrl}getFinished`
    return this.http.get<OrdersModel[]>(url)
  }

  //obtner solamente las que no estan termiandas
  getOnlyNotFinished(): Observable<OrdersModel[]> {
    const url = `${this.ApiUrl}getNotFinished`
    return this.http.get<OrdersModel[]>(url)
  }

  //crear una nueva orden

  Insertnew(order: Partial<OrdersModel>): Observable<OrdersModel> {
    const url = `${this.ApiUrl}insert`
    return this.http.post<OrdersModel>(url, order)
  }

  //actualizar una orden
  update(id: number, data: Partial<OrdersModel>): Observable<OrdersModel> {
    const url = `${this.ApiUrl}update/${id}`
    return this.http.put<OrdersModel>(url, data)
  }

  //terminar una orden
  finish(id: number) {
    const url = `${this.ApiUrl}finish/${id}`
    return this.http.post(url, id)
  }

  //dejar pendiente una orden
  notFinish(id: number) {
    const url = `${this.ApiUrl}notfinish/${id}`
    return this.http.post(url, id);
  }

  //eliminar una orden
  delete(id: number) {
    const url = `${this.ApiUrl}delete/${id}`
    return this.http.delete(url)
  }

  cobrarOrden(id: number) {
    const url = `${this.ApiUrl}cobrar/${id}`
    return this.http.post(url, {})
  }


}
