import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { FiltroPedidos, PedidosService } from '../services/pedidos';
import { ToastService } from '../services/toast.service';
import { ConfirmacionService } from '../services/confirmacion.service';
import { Zona, Pedido, EstadoPedido, Aviso } from '../models/logistica.model';
import { ESTADO_MAP, ESTADOS_ADMIN, ESTADOS_CON_COMENTARIO, FRANJAS } from '../models/estados';
import { etiquetaComprobante } from '../models/facturacion';
import { telefonoWhatsapp } from '../utils/telefono';
import { urlDestino } from '../utils/mapas';
import { mensajeError } from '../utils/errores';
import { BarraSuperiorComponent } from '../shared/barra-superior/barra-superior.component';
import { BotonTemaComponent } from '../shared/boton-tema/boton-tema.component';
import { PiePaginaComponent } from '../shared/pie-pagina/pie-pagina.component';

const POLLING_MS = 10_000;
const BUSQUEDA_MS = 300;

interface NovedadPendiente { id: string; estado: EstadoPedido; texto: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, BarraSuperiorComponent, BotonTemaComponent, PiePaginaComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private service = inject(PedidosService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirmacion = inject(ConfirmacionService);
  private destroyRef = inject(DestroyRef);
  private busqueda$ = new Subject<void>();

  // Para ignorar respuestas viejas si se cambia el filtro rápido
  private pedidoReqId = 0;

  // Datos
  zonas = signal<Zona[]>([]);
  avisos = signal<Aviso[]>([]);
  // Lo que devuelve el servidor para zona, fechas y búsqueda (sin filtrar por estado)
  pedidosCargados = signal<Pedido[]>([]);

  // Filtros
  zonaSeleccionada = signal('');
  estadoFiltro = signal<EstadoPedido | ''>('');
  busqueda = signal('');
  desde = signal('');
  hasta = signal('');

  // Pantalla
  cargando = signal(false);
  sinConexion = signal(false);
  fechaImpresion = signal(new Date());

  // Comentario de Con novedad / Reprogramado
  novedadPendiente = signal<NovedadPendiente | null>(null);
  errorNovedad = signal('');
  guardandoNovedad = signal(false);

  estadosDisponibles = ESTADOS_ADMIN.map(c => ESTADO_MAP[c]);
  franjas = FRANJAS;

  // Lo que se ve en pantalla: lo cargado, más el filtro por estado (instantáneo)
  pedidos = computed(() => {
    const estado = this.estadoFiltro();
    const todos = this.pedidosCargados();
    return estado ? todos.filter(p => p.estado === estado) : todos;
  });

  hayFiltros = computed(() =>
    !!(this.zonaSeleccionada() || this.estadoFiltro() || this.busqueda().trim() || this.desde() || this.hasta())
  );

  // Cantidad de pedidos por estado, sobre lo cargado
  resumen = computed(() => {
    const conteo = new Map<EstadoPedido, number>();
    for (const p of this.pedidosCargados()) conteo.set(p.estado, (conteo.get(p.estado) ?? 0) + 1);
    return ESTADOS_ADMIN.map(clave => ({ ...ESTADO_MAP[clave], cantidad: conteo.get(clave) ?? 0 }));
  });

  zonaNombres = computed(() =>
    new Map<string, string>(this.zonas().map(z => [String(z.id), z.nombre] as [string, string]))
  );

  // Hoja de ruta: pedidos agrupados por zona y ordenados por fecha, horario y dirección
  hojaImpresion = computed(() => {
    const posicion = new Map<string, number>(this.zonas().map((z, i) => [String(z.id), i] as [string, number]));
    const nombres = this.zonaNombres();
    const franja: Record<string, number> = { MANANA: 0, TARDE: 1 };

    const ordenados = [...this.pedidos()].sort((a, b) =>
      (posicion.get(String(a.zonaId)) ?? 99) - (posicion.get(String(b.zonaId)) ?? 99) ||
      (a.fechaProgramada ?? '9999').localeCompare(b.fechaProgramada ?? '9999') ||
      (franja[a.franjaHoraria ?? ''] ?? 2) - (franja[b.franjaHoraria ?? ''] ?? 2) ||
      a.direccion.localeCompare(b.direccion)
    );

    const grupos: { zonaId: string; nombre: string; items: Pedido[] }[] = [];
    for (const p of ordenados) {
      let grupo = grupos[grupos.length - 1];
      if (!grupo || grupo.zonaId !== p.zonaId) {
        grupo = { zonaId: p.zonaId, nombre: nombres.get(String(p.zonaId)) ?? 'Sin zona', items: [] };
        grupos.push(grupo);
      }
      grupo.items.push(p);
    }
    return grupos;
  });

  ngOnInit(): void {
    this.service.getZonas().subscribe({
      next: (zonas) => this.zonas.set(zonas),
      error: (err) => this.toast.error(mensajeError(err, 'No se pudieron cargar las zonas.')),
    });
    this.cargarPedidos();
    this.cargarAvisos();

    // Busca recién cuando se deja de escribir
    this.busqueda$.pipe(
      debounceTime(BUSQUEDA_MS),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.cargarPedidos());

    // Refresco automático (pausa si la pestaña está oculta)
    interval(POLLING_MS).pipe(
      filter(() => document.visibilityState === 'visible'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.cargarPedidos(false);
      this.cargarAvisos();
    });
  }

  estadoInfo(e: EstadoPedido) {
    return ESTADO_MAP[e] ?? ESTADO_MAP['PENDIENTE'];
  }

  esEstadoAdmin(e: EstadoPedido): boolean {
    return ESTADOS_ADMIN.includes(e);
  }

  zonaNombre(id: string): string {
    return this.zonaNombres().get(String(id)) ?? '';
  }

  destino(p: Pedido): string {
    return urlDestino(p);
  }

  comprobante(p: Pedido): string {
    return etiquetaComprobante(p);
  }

  // Iniciales para el círculo de la tarjeta ("María González" -> "MG")
  iniciales(nombre: string): string {
    const palabras = nombre.trim().split(/\s+/).filter(Boolean);
    const letras = palabras.length > 1 ? palabras[0][0] + palabras[1][0] : (palabras[0] ?? '?').slice(0, 2);
    return letras.toUpperCase();
  }

  urlTel(tel: string): string {
    return 'tel:' + tel.replace(/[^\d+]/g, '');
  }

  // Chat directo con el cliente (distinto de los avisos automáticos)
  urlWsp(tel: string): string | null {
    const numero = telefonoWhatsapp(tel);
    return numero ? `https://wa.me/${numero}` : null;
  }

  // ---------- Carga y filtros ----------
  private filtroServidor(): FiltroPedidos {
    return {
      zonaId: this.zonaSeleccionada() || undefined,
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
      q: this.busqueda().trim() || undefined,
    };
  }

  // conAviso = false: refresco silencioso (no muestra "Cargando..." ni avisa si falla)
  cargarPedidos(conAviso = true): void {
    if (conAviso && this.pedidosCargados().length === 0) this.cargando.set(true);
    const reqId = ++this.pedidoReqId;

    this.service.getPedidos(this.filtroServidor()).subscribe({
      next: (data) => {
        if (reqId !== this.pedidoReqId) return;
        this.pedidosCargados.set(data);
        this.cargando.set(false);
        this.sinConexion.set(false);
      },
      error: (err) => {
        if (reqId !== this.pedidoReqId) return;
        this.cargando.set(false);
        this.sinConexion.set(true);
        if (conAviso) this.toast.error(mensajeError(err, 'No se pudieron cargar los pedidos.'));
      }
    });
  }

  alCambiarZona(event: Event): void {
    this.zonaSeleccionada.set((event.target as HTMLSelectElement).value);
    this.cargarPedidos();
  }

  alBuscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
    this.busqueda$.next();
  }

  // Desde el resumen: tocar el estado activo lo desactiva
  filtrarEstado(estado: EstadoPedido | ''): void {
    this.estadoFiltro.set(this.estadoFiltro() === estado ? '' : estado);
  }

  alCambiarDesde(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.desde.set(valor);
    if (valor && this.hasta() && valor > this.hasta()) this.hasta.set(valor);
    this.cargarPedidos();
  }

  alCambiarHasta(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.hasta.set(valor);
    if (valor && this.desde() && valor < this.desde()) this.desde.set(valor);
    this.cargarPedidos();
  }

  limpiarFiltros(): void {
    this.zonaSeleccionada.set('');
    this.estadoFiltro.set('');
    this.busqueda.set('');
    this.desde.set('');
    this.hasta.set('');
    this.cargarPedidos();
  }

  // ---------- Imprimir ----------
  imprimirHoja(): void {
    if (this.pedidos().length === 0) {
      this.toast.info('No hay pedidos para imprimir.');
      return;
    }
    this.fechaImpresion.set(new Date());
    // Pequeña espera para que la hoja se actualice antes de abrir el cuadro de impresión
    setTimeout(() => window.print(), 100);
  }

  // ---------- Avisos a clientes ----------
  cargarAvisos(): void {
    this.service.getAvisosPendientes().subscribe({
      next: (data) => this.avisos.set(data),
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
    this.service.marcarAvisoEnviado(aviso.id).subscribe({
      next: () => {
        this.quitarAviso(aviso.id);
        this.toast.exito('Aviso marcado como enviado.');
      },
      error: () => this.toast.error('Se abrió WhatsApp, pero no se pudo marcar el aviso como enviado.')
    });
  }

  descartarAviso(aviso: Aviso): void {
    this.service.descartarAviso(aviso.id).subscribe({
      next: () => {
        this.quitarAviso(aviso.id);
        this.toast.info('Aviso descartado.');
      },
      error: (err) => this.toast.error(mensajeError(err, 'No se pudo descartar el aviso.'))
    });
  }

  private quitarAviso(id: string): void {
    this.avisos.update(l => l.filter(a => a.id !== id));
  }

  // ---------- Estados ----------
  alCambiarEstado(id: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nuevo = select.value as EstadoPedido;
    const actual = this.pedidosCargados().find(p => p.id === id);
    if (!actual || actual.estado === nuevo) return;

    // Con novedad / Reprogramado piden un comentario: el select vuelve atrás hasta confirmar
    if (ESTADOS_CON_COMENTARIO.includes(nuevo)) {
      select.value = actual.estado;
      this.errorNovedad.set('');
      this.novedadPendiente.set({ id, estado: nuevo, texto: '' });
      return;
    }

    this.novedadPendiente.set(null);
    this.enviarEstado(id, nuevo, undefined, {
      alError: (msg) => {
        select.value = actual.estado; // vuelve al estado anterior
        this.toast.error(msg);
      }
    });
  }

  alEscribirNovedad(event: Event): void {
    const texto = (event.target as HTMLTextAreaElement).value;
    this.novedadPendiente.update(n => (n ? { ...n, texto } : n));
  }

  cancelarNovedad(): void {
    this.novedadPendiente.set(null);
    this.errorNovedad.set('');
  }

  confirmarNovedad(): void {
    const np = this.novedadPendiente();
    if (!np) return;
    const texto = np.texto.trim();
    if (texto.length < 3) {
      this.errorNovedad.set(np.estado === 'CON_NOVEDAD' ? 'Contanos brevemente qué pasó' : 'Indicá el motivo');
      return;
    }

    this.guardandoNovedad.set(true);
    this.enviarEstado(np.id, np.estado, texto, {
      alExito: () => {
        this.novedadPendiente.set(null);
        this.guardandoNovedad.set(false);
      },
      alError: (msg) => {
        this.errorNovedad.set(msg);
        this.guardandoNovedad.set(false);
      }
    });
  }

  private enviarEstado(
    id: string,
    estado: EstadoPedido,
    comentario: string | undefined,
    cb: { alExito?: () => void; alError?: (msg: string) => void }
  ): void {
    this.service.actualizarEstado(id, estado, comentario).subscribe({
      next: (res) => {
        this.pedidosCargados.update(l => l.map(p => p.id === id ? res : p));
        cb.alExito?.();
        this.toast.exito(`${res.clienteNombre}: ${this.estadoInfo(res.estado).label}`);
        this.cargarAvisos(); // el backend pudo generar un aviso nuevo
      },
      error: (err) => {
        const msg = mensajeError(err, 'No se pudo cambiar el estado.');
        if (cb.alError) cb.alError(msg);
        else this.toast.error(msg);
      }
    });
  }

  // ---------- Pedidos ----------
  irANuevoPedido(): void { this.router.navigate(['/new-order']); }
  editarPedido(id: string): void { this.router.navigate(['/edit-order', id]); }

  async eliminarPedido(p: Pedido): Promise<void> {
    const aceptado = await this.confirmacion.pedir({
      titulo: 'Eliminar pedido',
      mensaje: `Se va a eliminar el pedido de ${p.clienteNombre}. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!aceptado) return;

    this.service.deletePedido(p.id).subscribe({
      next: () => {
        this.pedidosCargados.update(l => l.filter(x => x.id !== p.id));
        this.cargarAvisos();
        this.toast.exito('Pedido eliminado.');
      },
      error: (err) => this.toast.error(mensajeError(err, 'No se pudo eliminar el pedido.'))
    });
  }
}