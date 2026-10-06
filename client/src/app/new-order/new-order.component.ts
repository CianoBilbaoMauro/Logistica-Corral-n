import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PedidosService } from '../services/pedidos';
import { Zona, Pedido, EstadoPedido } from '../models/logistica.model';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-order.component.html',
  styleUrl: './new-order.component.css'
})
export class NewOrderComponent implements OnInit {
  private pedidosService = inject(PedidosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  zonas: Zona[] = [];
  guardando = false; isDarkMode = false; dropdownAbierto = false;
  modoEdicion = false; pedidoId: string | null = null;
  nuevoPedido: any = { zonaId: '', clienteNombre: '', clienteTelefono: '', direccion: '', fechaProgramada: '', franjaHoraria: '', camioneroNombre: '', observacionEntrega: '' };

  ngOnInit(): void {
    this.cargarZonas();
    this.isDarkMode = document.body.classList.contains('dark-theme');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.modoEdicion = true; this.pedidoId = id; this.cargarPedidoParaEditar(id); }
  }

  cargarPedidoParaEditar(id: string): void {
    this.pedidosService.getPedidos().subscribe({
      next: (pedidos) => {
        const p = pedidos.find((x:any) => x.id === id);
        if (p) this.nuevoPedido = { zonaId: p.zonaId, clienteNombre: p.clienteNombre, clienteTelefono: p.clienteTelefono, direccion: p.direccion, fechaProgramada: p.fechaProgramada || '', franjaHoraria: p.franjaHoraria || '', camioneroNombre: (p as any).camioneroNombre || '', observacionEntrega: p.observacionEntrega || '' };
      }
    });
  }

  toggleDarkMode(): void { this.isDarkMode =!this.isDarkMode; document.body.classList.toggle('dark-theme', this.isDarkMode); }
  toggleDropdown(): void { this.dropdownAbierto =!this.dropdownAbierto; }
  @HostListener('document:click', ['$event']) cerrarSiTocaAfuera(e: MouseEvent) { if (!(e.target as HTMLElement).closest('.custom-select-container')) this.dropdownAbierto = false; }
  seleccionarZona(id: any): void { this.nuevoPedido.zonaId = id; this.dropdownAbierto = false; }
  getZonaNombreSeleccionada(): string { const z = this.zonas.find(x => x.id == this.nuevoPedido.zonaId); return z? z.nombre : 'Seleccionar Zona'; }
  cargarZonas(): void { this.pedidosService.getZonas().subscribe({ next: (d) => this.zonas = d }); }
  cancelar(): void { this.router.navigate(['/home']); }

  guardarPedido(): void {
    if (!this.nuevoPedido.zonaId ||!this.nuevoPedido.clienteNombre ||!this.nuevoPedido.clienteTelefono ||!this.nuevoPedido.direccion) { alert('Completá los obligatorios'); return; }
    this.guardando = true;
    if (this.modoEdicion && this.pedidoId) {
      this.pedidosService.actualizarPedido(this.pedidoId, this.nuevoPedido).subscribe({ next: () => this.router.navigate(['/home']), error: () => { this.guardando = false; alert('Error al actualizar'); } });
    } else {
      this.pedidosService.crearPedido({...this.nuevoPedido, estado: 'PENDIENTE' as EstadoPedido }).subscribe({ next: () => this.router.navigate(['/home']), error: () => { this.guardando = false; alert('Error al guardar'); } });
    }
  }
}