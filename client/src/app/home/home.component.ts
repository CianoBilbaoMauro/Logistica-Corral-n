import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { FiltroPedidos, PedidosService } from '../services/pedidos';
import { Zona, Pedido, EstadoPedido, Aviso } from '../models/logistica.model';
import { ESTADO_MAP, ESTADOS_ADMIN, ESTADOS_CON_COMENTARIO, FRANJAS } from '../models/estados';
import { mensajeError } from '../utils/errores';

const POLLING_MS = 10_000;
const BUSQUEDA_MS = 300;

interface NovedadPendiente { id: string; estado: EstadoPedido; texto: string; }

type Rapido = 'hoy' | '7dias' | 'mes' | 'todos' | 'personalizado';

// Fecha local en formato YYYY-MM-DD (sin desfase por zona horaria)
function fechaLocal(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

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
  private busqueda$ = new Subject<void>();

  // Para ignorar respuestas viejas si se cambia el filtro rápido
  private pedidoReqId = 0;

  pedidos: Pedido[] = [];
  zonas: Zona[] = [];
  avisos: Aviso[] = [];

  // Filtros
  zonaSeleccionada = '';
  estadoFiltro: EstadoPedido | '' = '';
  busqueda = '';
  desde = '';
  hasta = '';
  rapido: Rapido = 'todos';

  cargando = false;
  isDarkMode = false;

  novedadPendiente: NovedadPendiente | null = null;
  errorNovedad = '';
  guardandoNovedad = false;

  estadosDisponibles = ESTADOS_ADMIN.map(c => ESTADO_MAP[c]);
  franjas = FRANJAS;

  chips: { clave: Rapido; label: string }[] = [
    { clave: 'hoy', label: 'Hoy' },
    { clave: '7dias', label: 'Últimos 7 días' },
    { clave: 'mes', label: 'Este mes' },
    { clave: 'todos', label: 'Todos' },
  ];

  get hayFiltros(): boolean {
    return !!(this.zonaSeleccionada || this.estadoFiltro || this.busqueda.trim() || this.desde || this.hasta);
  }

  ngOnInit(): void {
    this.isDarkMode = document.body.classList.contains('dark-theme');
    this.cargarZonas();
    this.cargarPedidos();
    this.cargarAvisos();

    // Busca recién cuando se deja de escribir
    this.busqueda$.pipe(
      debounceTime(BUSQUEDA_MS),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.cargarPedidos(this.zonaSeleccionada));

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

  esEstadoAdmin(e: EstadoPedido): boolean {
    return ESTADOS_ADMIN.includes(e);
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

  // ---------- Filtros ----------
  private filtroActual(): FiltroPedidos {
    return {
      zonaId: this.zonaSeleccionada || undefined,
      estado: this.estadoFiltro || undefined,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
      q: this.busqueda.trim() || undefined,
    };
  }

  cargarPedidos(zonaId?: string): void {
    // El cartel "Cargando..." solo aparece si no hay nada en pantalla (evita que la lista salte)
    this.cargando = this.pedidos.length === 0;
    this.zonaSeleccionada = zonaId || '';
    const reqId = ++this.pedidoReqId;

    this.pedidosService.getPedidos(this.filtroActual()).subscribe({
      next: (data) => {
        if (reqId !== this.pedidoReqId) return;
        this.pedidos = [...data];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (reqId !== this.pedidoReqId) return;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Igual que cargarPedidos pero sin tocar el cartel de carga
  private refrescarPedidos(): void {
    const reqId = ++this.pedidoReqId;
    this.pedidosService.getPedidos(this.filtroActual()).subscribe({
      next: (data) => {
        if (reqId !== this.pedidoReqId) return;
        this.pedidos = [...data];
        this.cdr.detectChanges();
      }
    });
  }

  alBuscar(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
    this.busqueda$.next();
  }

  alCambiarFiltroEstado(event: Event): void {
    this.estadoFiltro = (event.target as HTMLSelectElement).value as EstadoPedido | '';
    this.cargarPedidos(this.zonaSeleccionada);
  }

  aplicarRapido(r: Rapido): void {
    const hoy = new Date();
    if (r === 'hoy') {
      this.desde = this.hasta = fechaLocal(hoy);
    } else if (r === '7dias') {
      const inicio = new Date(hoy);
      inicio.setDate(inicio.getDate() - 6);
      this.desde = fechaLocal(inicio);
      this.hasta = fechaLocal(hoy);
    } else if (r === 'mes') {
      this.desde = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      this.hasta = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
    } else {
      this.desde = '';
      this.hasta = '';
    }
    this.rapido = r;
    this.cargarPedidos(this.zonaSeleccionada);
  }

  alCambiarDesde(event: Event): void {
    this.desde = (event.target as HTMLInputElement).value;
    if (this.desde && this.hasta && this.desde > this.hasta) this.hasta = this.desde;
    this.rapido = this.desde || this.hasta ? 'personalizado' : 'todos';
    this.cargarPedidos(this.zonaSeleccionada);
  }

  alCambiarHasta(event: Event): void {
    this.hasta = (event.target as HTMLInputElement).value;
    if (this.desde && this.hasta && this.hasta < this.desde) this.desde = this.hasta;
    this.rapido = this.desde || this.hasta ? 'personalizado' : 'todos';
    this.cargarPedidos(this.zonaSeleccionada);
  }

  limpiarFiltros(): void {
    this.desde = '';
    this.hasta = '';
    this.estadoFiltro = '';
    this.busqueda = '';
    this.rapido = 'todos';
    this.cargarPedidos('');
  }

  // ---------- Avisos ----------
  cargarAvisos(): void {
    this.pedidosService.getAvisosPendientes().subscribe({
      next: (data) => { this.avisos = data; this.cdr.detectChanges(); }
    });
  }

  // ---------- Estados ----------
  alCambiarEstado(id: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nuevo = select.value as EstadoPedido;
    const anterior = this.pedidos.find(p => p.id === id)?.estado;

    // Con novedad / Reprogramado piden un comentario: el select vuelve atrás hasta confirmar
    if (ESTADOS_CON_COMENTARIO.includes(nuevo)) {
      if (anterior) select.value = anterior;
      this.errorNovedad = '';
      this.novedadPendiente = { id, estado: nuevo, texto: '' };
      this.cdr.detectChanges();
      return;
    }

    this.novedadPendiente = null;
    this.enviarEstado(id, nuevo, undefined, {
      alError: (msg) => {
        if (anterior) select.value = anterior; // vuelve al estado anterior
        alert(msg);
      }
    });
  }

  alEscribirNovedad(event: Event): void {
    if (this.novedadPendiente) {
      this.novedadPendiente.texto = (event.target as HTMLTextAreaElement).value;
    }
  }

  cancelarNovedad(): void {
    this.novedadPendiente = null;
    this.errorNovedad = '';
  }

  confirmarNovedad(): void {
    const np = this.novedadPendiente;
    if (!np) return;
    const texto = np.texto.trim();
    if (texto.length < 3) {
      this.errorNovedad = np.estado === 'CON_NOVEDAD' ? 'Contanos brevemente qué pasó' : 'Indicá el motivo';
      return;
    }

    this.guardandoNovedad = true;
    this.enviarEstado(np.id, np.estado, texto, {
      alExito: () => { this.novedadPendiente = null; this.guardandoNovedad = false; },
      alError: (msg) => { this.errorNovedad = msg; this.guardandoNovedad = false; this.cdr.detectChanges(); }
    });
  }

  private enviarEstado(
    id: string,
    estado: EstadoPedido,
    comentario: string | undefined,
    cb: { alExito?: () => void; alError?: (msg: string) => void }
  ): void {
    this.pedidosService.actualizarEstado(id, estado, comentario).subscribe({
      next: (res) => {
        this.pedidos = this.pedidos.map(p => p.id === id ? res : p);
        cb.alExito?.();
        this.cdr.detectChanges();
        this.cargarAvisos(); // el backend pudo generar un aviso nuevo
      },
      error: (err) => {
        cb.alError?.(mensajeError(err, 'No se pudo cambiar el estado'));
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