import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService } from '../services/pedidos';
import { Zona, Pedido, EstadoPedido } from '../models/logistica.model';

@Component({
  selector: 'app-camionero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camionero.component.html',
  styleUrl: './camionero.component.css'
})
export class CamioneroComponent implements OnInit {
  private service = inject(PedidosService);
  zonas: Zona[] = [];
  pedidos: Pedido[] = [];
  zonaSeleccionada = localStorage.getItem('zona_camionero') || '';
  cargando = false;
  estados: EstadoPedido[] = ['EN_CAMINO','LLEGA_PRONTO','ENTREGADO','CON_NOVEDAD','REPROGRAMADO'];

  ngOnInit() {
    this.service.getZonas().subscribe(z => this.zonas = z);
    this.cargar();
    // Se actualiza solo cada 10 seg por si el admin asigna algo nuevo
    setInterval(() => { if(this.zonaSeleccionada) this.cargar(false) }, 10000);
  }

  cargar(conSpinner = true){
    if(!this.zonaSeleccionada) return;
    localStorage.setItem('zona_camionero', this.zonaSeleccionada);
    if(conSpinner) this.cargando = true;
    this.service.getPedidos(this.zonaSeleccionada).subscribe(p => {
      // Camionero solo ve lo que NO es PENDIENTE
      this.pedidos = p.filter(x => x.estado!== 'PENDIENTE');
      this.cargando = false;
    });
  }

  cambiarEstado(p: Pedido, estado: EstadoPedido){
    this.service.actualizarEstado(p.id, estado).subscribe(res => {
      p.estado = res.estado;
      if(estado === 'ENTREGADO') {
        setTimeout(()=> this.pedidos = this.pedidos.filter(x => x.id!== p.id), 500);
      }
    });
  }

  getColor(estado: string){
    switch(estado){
      case 'EN_CAMINO': return '#3498db';
      case 'LLEGA_PRONTO': return '#f1c40f';
      case 'ENTREGADO': return '#2ecc71';
      case 'CON_NOVEDAD': return '#e74c3c';
      case 'REPROGRAMADO': return '#9b59b6';
      default: return '#ccc';
    }
  }

  abrirMapa(dir: string){
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`,'_blank');
  }
}