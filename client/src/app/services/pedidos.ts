import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Zona, Pedido, EstadoPedido, Aviso } from '../models/logistica.model';

export interface FiltroPedidos {
  zonaId?: string;
  estado?: EstadoPedido;
  desde?: string; // YYYY-MM-DD (fecha de entrega programada)
  hasta?: string; // YYYY-MM-DD
  q?: string;     // cliente, teléfono o dirección
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/api';

  getZonas(): Observable<Zona[]> {
    return this.http.get<Zona[]>(`${this.apiUrl}/zonas`);
  }

  getPedidos(filtro: FiltroPedidos = {}): Observable<Pedido[]> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtro)) {
      if (valor) params = params.set(clave, valor);
    }
    return this.http.get<Pedido[]>(`${this.apiUrl}/pedidos`, { params }).pipe(
      map((pedidos) => pedidos.map((p) => ({
        ...p,
        estado: !p.estado ? ('PENDIENTE' as EstadoPedido) : p.estado
      })))
    );
  }

  getPedidoPorId(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/pedidos/${id}`);
  }

  crearPedido(pedido: Partial<Pedido>): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/pedidos`, pedido);
  }

  actualizarPedido(id: string, pedido: Partial<Pedido>): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/pedidos/${id}`, pedido);
  }

  actualizarEstado(id: string, estado: EstadoPedido, comentario?: string): Observable<Pedido> {
    const body = comentario ? { estado, comentario } : { estado };
    return this.http.patch<Pedido>(`${this.apiUrl}/pedidos/${id}/estado`, body);
  }

  deletePedido(id: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/pedidos/${id}`);
  }

  // Avisos a clientes
  getAvisosPendientes(): Observable<Aviso[]> {
    return this.http.get<Aviso[]>(`${this.apiUrl}/avisos`);
  }

  marcarAvisoEnviado(id: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/avisos/${id}/enviado`, {});
  }

  descartarAviso(id: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/avisos/${id}/descartado`, {});
  }
}