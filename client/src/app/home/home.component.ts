import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PedidosService } from '../services/pedidos';
import { Zona, Pedido, EstadoPedido } from '../models/logistica.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private pedidosService = inject(PedidosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  pedidos: Pedido[] = [];
  zonas: Zona[] = [];
  zonaSeleccionada: string = '';
  cargando: boolean = false;
  isDarkMode = false;

  estadosDisponibles: { clave: EstadoPedido; label: string }[] = [
    { clave: 'PENDIENTE', label: 'Sin Notificar' },
    { clave: 'NOTIFICADO', label: 'Notificado' },
    { clave: 'EN_PREPARACION', label: 'En Preparación' },
    { clave: 'EN_CAMINO', label: 'En Camino' },
    { clave: 'LLEGA_PRONTO', label: 'Llega Pronto' },
    { clave: 'REPROGRAMADO', label: 'Reprogramado' },
    { clave: 'ENTREGADO', label: 'Entregado' },
    { clave: 'CON_NOVEDAD', label: 'Con Novedad' }
  ];

  ngOnInit(): void {
    this.cargarZonas();
    this.cargarPedidos();
  }

  toggleDarkMode(): void {
    this.isDarkMode =!this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  cargarZonas(): void {
    this.pedidosService.getZonas().subscribe({
      next: (data) => { this.zonas = data; this.cdr.detectChanges(); }
    });
  }

  cargarPedidos(zonaId?: string): void {
    this.cargando = true;
    this.zonaSeleccionada = zonaId || '';
    this.pedidosService.getPedidos(zonaId).subscribe({
      next: (data) => {
        this.pedidos = [...data];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  alCambiarEstado(id: string, event: Event): void {
    const nuevoEstado = (event.target as HTMLSelectElement).value as EstadoPedido;
    this.pedidosService.actualizarEstado(id, nuevoEstado).subscribe({
      next: (pedidoActualizado) => {
        const index = this.pedidos.findIndex((p) => p.id === id);
        if (index!== -1) {
          this.pedidos[index].estado = pedidoActualizado.estado;
          this.pedidos = [...this.pedidos];
          this.cdr.detectChanges();
          if (nuevoEstado!== 'PENDIENTE') this.enviarNotificacionWhatsApp(this.pedidos[index]);
        }
      }
    });
  }

  enviarNotificacionWhatsApp(pedido: Pedido): void {
    if (!pedido.clienteTelefono) return;
    const etiquetas: Record<EstadoPedido, string> = {
      PENDIENTE: 'Pendiente', NOTIFICADO: 'Notificado', EN_PREPARACION: 'En Preparación',
      EN_CAMINO: 'En Camino', LLEGA_PRONTO: 'Llega Pronto', REPROGRAMADO: 'Reprogramado',
      ENTREGADO: 'Entregado', CON_NOVEDAD: 'Con Novedad'
    };
    const mensaje = `🏗️ *Gabarain Materiales*\nHola *${pedido.clienteNombre}*, estado: ${etiquetas[pedido.estado]}\n📍 ${pedido.direccion}\n📅 ${pedido.fechaProgramada || 'Próximo viaje'}`;
    const tel = pedido.clienteTelefono.replace(/\D/g, '');
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  irANuevoPedido(): void { this.router.navigate(['/new-order']); }
  editarPedido(id: string): void { this.router.navigate(['/edit-order', id]); }

  eliminarPedido(id: string): void {
    if (!confirm('¿Eliminar este pedido?')) return;
    this.pedidosService.deletePedido(id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter(p => p.id!== id);
        this.cdr.detectChanges();
      },
      error: () => alert('No se pudo eliminar')
    });
  }
}