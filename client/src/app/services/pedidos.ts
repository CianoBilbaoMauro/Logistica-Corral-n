import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Zona, Pedido, EstadoPedido } from '../models/logistica.model';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/api';

  getZonas(): Observable<Zona[]> {
    return this.http.get<Zona[]>(`${this.apiUrl}/zonas`);
  }

  getPedidos(zonaId?: string): Observable<Pedido[]> {
    const url = zonaId? `${this.apiUrl}/pedidos?zonaId=${zonaId}` : `${this.apiUrl}/pedidos`;
    return this.http.get<Pedido[]>(url).pipe(
      map((pedidos) => pedidos.map((p) => ({
       ...p,
        estado:!p.estado? 'PENDIENTE' as EstadoPedido : p.estado
      })))
    );
  }

  getPedidoPorId(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/pedidos/${id}`);
  }

  crearPedido(pedido: Partial<Pedido>): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/pedidos`, {
     ...pedido,
      estado: pedido.estado || 'PENDIENTE'
    });
  }

  actualizarPedido(id: string, pedido: Partial<Pedido>): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/pedidos/${id}`, pedido);
  }

  actualizarEstado(id: string, estado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.apiUrl}/pedidos/${id}/estado`, { estado });
  }

  deletePedido(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pedidos/${id}`);
  }
}