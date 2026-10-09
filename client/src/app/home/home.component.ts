import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PedidosService } from '../services/pedidos';
import { Zona, Pedido, EstadoPedido, Aviso } from '../models/logistica.model';
import { ESTADOS, ESTADO_MAP, FRANJAS } from '../models/estados';

const POLLING_MS = 10_000;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private pedidosService = inject(PedidosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  pedidos: Pedido[] = [];
  zonas: Zona[] = [];
  avisos: Aviso[] = [];
  zonaSeleccionada = '';
  cargando = false;
  isDarkMode = false;

  estadosDisponibles = ESTADOS;
  franjas = FRANJAS;

  ngOnInit(): void {
    this.isDarkMode = document.body.classList.contains('dark-theme');
    this.cargarZonas();
    this.cargarPedidos();
    this.cargarAvisos();

    // Refresco automático (pausa si la pestaña está oculta)
    interval(POLLING_MS).pipe(
      filter(() => document.visibilityState === 'visible'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.refrescarPedidos();
      this.cargarAvisos();
    });
  }

  estadoInfo(e: EstadoPedido) {
    return ESTADO_MAP[e] ?? ESTADO_MAP['PENDIENTE'];
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
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
    this.pedidosService.getPedidos(zonaId || undefined).subscribe({
      next: (data) => {
        this.pedidos = [...data];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  // Igual que cargarPedidos pero sin cartel de "Cargando..."
  private refrescarPedidos(): void {
    this.pedidosService.getPedidos(this.zonaSeleccionada || undefined).subscribe({
      next: (data) => { this.pedidos = [...data]; this.cdr.detectChanges(); }
    });
  }

  cargarAvisos(): void {
    this.pedidosService.getAvisosPendientes().subscribe({
      next: (data) => { this.avisos = data; this.cdr.detectChanges(); }
    });
  }

  alCambiarEstado(id: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nuevoEstado = select.value as EstadoPedido;
    const anterior = this.pedidos.find(p => p.id === id)?.estado;

    this.pedidosService.actualizarEstado(id, nuevoEstado).subscribe({
      next: (pedidoActualizado) => {
        const index = this.pedidos.findIndex((p) => p.id === id);
        if (index !== -1) {
          this.pedidos[index].estado = pedidoActualizado.estado;
          this.pedidos = [...this.pedidos];
          this.cdr.detectChanges();
        }
        this.cargarAvisos(); // el backend pudo generar un aviso nuevo
      },
      error: () => {
        if (anterior) select.value = anterior; // vuelve al estado anterior
        alert('No se pudo cambiar el estado');
      }
    });
  }

  // Abre WhatsApp con el mensaje listo y marca el aviso como enviado
  enviarWhatsApp(aviso: Aviso): void {
    if (!aviso.telefono) return;
    window.open(
      `https://wa.me/${aviso.telefono}?text=${encodeURIComponent(aviso.mensaje)}`,
      '_blank',
      'noopener'
    );
    this.pedidosService.marcarAvisoEnviado(aviso.id).subscribe({
      next: () => this.quitarAviso(aviso.id),
      error: () => alert('Se abrió WhatsApp, pero no se pudo marcar el aviso como enviado.')
    });
  }

  descartarAviso(aviso: Aviso): void {
    this.pedidosService.descartarAviso(aviso.id).subscribe({
      next: () => this.quitarAviso(aviso.id),
      error: () => alert('No se pudo descartar el aviso')
    });
  }

  private quitarAviso(id: string): void {
    this.avisos = this.avisos.filter(a => a.id !== id);
    this.cdr.detectChanges();
  }

  irANuevoPedido(): void { this.router.navigate(['/new-order']); }
  editarPedido(id: string): void { this.router.navigate(['/edit-order', id]); }

  eliminarPedido(id: string): void {
    if (!confirm('¿Eliminar este pedido?')) return;
    this.pedidosService.deletePedido(id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter(p => p.id !== id);
        this.cdr.detectChanges();
        this.cargarAvisos();
      },
      error: () => alert('No se pudo eliminar')
    });
  }
}