import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, interval, of } from 'rxjs';
import { catchError, filter, finalize, switchMap, tap } from 'rxjs/operators';
import { PedidosService } from '../services/pedidos';
import { ToastService } from '../services/toast.service';
import { Zona, Pedido, EstadoPedido } from '../models/logistica.model';
import { ESTADO_MAP, ESTADOS_CON_COMENTARIO, FRANJAS } from '../models/estados';
import { urlDestino } from '../utils/mapas';
import { mensajeError } from '../utils/errores';
import { BarraSuperiorComponent } from '../shared/barra-superior/barra-superior.component';
import { BotonTemaComponent } from '../shared/boton-tema/boton-tema.component';
import { PiePaginaComponent } from '../shared/pie-pagina/pie-pagina.component';

const ZONAS_KEY = 'zonas_camionero';
const ZONA_KEY_VIEJA = 'zona_camionero';
const POLLING_MS = 10_000;

// Estados que el camionero NO ve en su lista (para que Con novedad tampoco se vea, agregalo acá)
const OCULTOS: EstadoPedido[] = ['PENDIENTE', 'ENTREGADO', 'REPROGRAMADO'];

// Botones que el camionero puede tocar, en este orden
const PERMITIDOS: EstadoPedido[] = ['EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'CON_NOVEDAD', 'REPROGRAMADO'];

// Secciones de la lista
const SECCIONES: { clave: string; titulo: string; estados: EstadoPedido[] }[] = [
  { clave: 'preparar', titulo: 'Para preparar', estados: ['NOTIFICADO', 'EN_PREPARACION'] },
  { clave: 'ruta',     titulo: 'En camino',     estados: ['EN_CAMINO'] },
  { clave: 'novedad',  titulo: 'Con novedad',   estados: ['CON_NOVEDAD'] },
];

interface NovedadPendiente { id: string; estado: EstadoPedido; texto: string; }

// Zonas guardadas en el celular (migra la clave vieja de una sola zona)
function zonasGuardadas(): string[] {
  try {
    const nuevas = localStorage.getItem(ZONAS_KEY);
    if (nuevas) {
      const lista = JSON.parse(nuevas);
      if (Array.isArray(lista)) return lista.filter((x): x is string => typeof x === 'string');
    }
    const vieja = localStorage.getItem(ZONA_KEY_VIEJA);
    return vieja ? [vieja] : [];
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-camionero',
  standalone: true,
  imports: [DatePipe, BarraSuperiorComponent, BotonTemaComponent, PiePaginaComponent],
  templateUrl: './camionero.component.html',
  styleUrl: './camionero.component.css'
})
export class CamioneroComponent implements OnInit {
  private service = inject(PedidosService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private cargar$ = new Subject<{ spinner: boolean }>();

  zonas = signal<Zona[]>([]);
  // Todos los pedidos visibles para el camionero, de cualquier zona
  private todos = signal<Pedido[]>([]);
  zonasSeleccionadas = signal<string[]>(zonasGuardadas());
  cargando = signal(false);
  error = signal<string | null>(null);
  actualizando = signal<Set<string>>(new Set());
  novedadPendiente = signal<NovedadPendiente | null>(null);
  errorNovedad = signal('');

  // Los de las zonas elegidas: al tildar o destildar cambia al instante, sin pedir nada al servidor
  pedidos = computed(() => {
    const ids = this.zonasSeleccionadas();
    return this.todos().filter(p => ids.includes(String(p.zonaId)));
  });

  // Texto del desplegable: "Miramar Centro, Mar del Sur"
  resumenZonas = computed(() => {
    const ids = this.zonasSeleccionadas();
    if (ids.length === 0) return 'Elegí tus zonas';
    const nombres = ids.map(id => this.zonaNombre(id)).filter(Boolean);
    return nombres.length ? nombres.join(', ') : `${ids.length} zonas`;
  });

  // Pedidos agrupados por sección (las vacías no se muestran)
  secciones = computed(() =>
    SECCIONES
      .map(s => ({ ...s, items: this.pedidos().filter(p => s.estados.includes(p.estado)) }))
      .filter(s => s.items.length > 0)
  );

  estados = PERMITIDOS.map(c => ESTADO_MAP[c]);
  franjas = FRANJAS;

  ngOnInit() {
    // switchMap cancela la request anterior si llega una nueva (polling)
    this.cargar$.pipe(
      tap(({ spinner }) => { if (spinner) { this.cargando.set(true); this.error.set(null); } }),
      switchMap(() => this.service.getPedidos().pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(pedidos => {
      this.cargando.set(false);
      if (pedidos === null) {
        this.error.set('No pudimos actualizar tus entregas. Se reintenta solo.');
        return;
      }
      if (this.actualizando().size) return; // no pisar un cambio de estado en curso
      this.error.set(null);
      this.todos.set(pedidos.filter(p => !OCULTOS.includes(p.estado)));
    });

    this.service.getZonas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(zonas => {
      this.zonas.set(zonas);
      // Si alguna zona guardada ya no existe, la sacamos
      const validas = this.zonasSeleccionadas().filter(id => zonas.some(z => String(z.id) === id));
      if (validas.length !== this.zonasSeleccionadas().length) this.guardarZonas(validas);
    });

    // Refresca solo (pausa si la pestaña está oculta)
    interval(POLLING_MS).pipe(
      filter(() => document.visibilityState === 'visible'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.cargar$.next({ spinner: false }));

    // Carga inicial: trae todo una sola vez, con cartel de "Cargando..."
    this.cargar$.next({ spinner: true });
  }

  // ---------- Zonas ----------
  zonaNombre(id: string): string {
    return this.zonas().find(z => String(z.id) === String(id))?.nombre ?? '';
  }

  estaTildada(id: string): boolean {
    return this.zonasSeleccionadas().includes(String(id));
  }

  alTildarZona(id: string, event: Event) {
    const tildada = (event.target as HTMLInputElement).checked;
    const actuales = this.zonasSeleccionadas();
    const nuevas = tildada
      ? (actuales.includes(id) ? actuales : [...actuales, id])
      : actuales.filter(z => z !== id);
    this.guardarZonas(nuevas);
  }

  todasLasZonas() { this.guardarZonas(this.zonas().map(z => String(z.id))); }
  ningunaZona() { this.guardarZonas([]); }

  private guardarZonas(ids: string[]) {
    this.zonasSeleccionadas.set(ids);
    try {
      if (ids.length) localStorage.setItem(ZONAS_KEY, JSON.stringify(ids));
      else localStorage.removeItem(ZONAS_KEY);
      localStorage.removeItem(ZONA_KEY_VIEJA);
    } catch { /* sin almacenamiento: funciona igual, solo no recuerda */ }

    // Si estaba abierto el cuadro de novedad de un pedido que ya no se ve, lo cerramos
    const np = this.novedadPendiente();
    if (np && !this.pedidos().some(p => p.id === np.id)) this.novedadPendiente.set(null);
  }

  // ---------- Estados ----------
  // Click en un botón de estado: Con novedad / Reprogramado piden un comentario primero
  pulsarEstado(p: Pedido, estado: EstadoPedido) {
    if (this.actualizando().has(p.id)) return;

    if (ESTADOS_CON_COMENTARIO.includes(estado)) {
      this.errorNovedad.set('');
      this.novedadPendiente.set({ id: p.id, estado, texto: p.estado === estado ? (p.novedad ?? '') : '' });
      return;
    }
    this.novedadPendiente.set(null);
    this.cambiarEstado(p.id, estado);
  }

  alEscribirNovedad(event: Event) {
    const texto = (event.target as HTMLTextAreaElement).value;
    this.novedadPendiente.update(n => (n ? { ...n, texto } : n));
  }

  cancelarNovedad() {
    this.novedadPendiente.set(null);
    this.errorNovedad.set('');
  }

  confirmarNovedad() {
    const np = this.novedadPendiente();
    if (!np) return;
    const texto = np.texto.trim();
    if (texto.length < 3) {
      this.errorNovedad.set(np.estado === 'CON_NOVEDAD' ? 'Contanos brevemente qué pasó' : 'Indicá el motivo');
      return;
    }
    this.cambiarEstado(np.id, np.estado, texto, () => this.novedadPendiente.set(null));
  }

  private cambiarEstado(id: string, estado: EstadoPedido, comentario?: string, alExito?: () => void) {
    const actual = this.todos().find(x => x.id === id);
    if (!actual || this.actualizando().has(id)) return;
    if (actual.estado === estado && !comentario) return;

    const anterior = actual.estado;
    this.setEstado(id, estado);      // actualización optimista
    this.marcar(id, true);

    this.service.actualizarEstado(id, estado, comentario)
      .pipe(finalize(() => this.marcar(id, false)))
      .subscribe({
        next: res => {
          this.todos.update(l => l.map(x => x.id === id ? res : x));
          alExito?.();
          if (OCULTOS.includes(res.estado)) {
            setTimeout(() => this.todos.update(l => l.filter(x => x.id !== id)), 600);
          }
        },
        error: (err) => {
          this.setEstado(id, anterior); // rollback
          this.toast.error(mensajeError(err, 'No se pudo cambiar el estado. Probá de nuevo.'));
        }
      });
  }

  private setEstado(id: string, estado: EstadoPedido) {
    this.todos.update(l => l.map(x => x.id === id ? { ...x, estado } : x));
  }

  private marcar(id: string, activo: boolean) {
    this.actualizando.update(s => {
      const n = new Set(s);
      if (activo) n.add(id); else n.delete(id);
      return n;
    });
  }

  estadoInfo(e: EstadoPedido) {
    return ESTADO_MAP[e] ?? ESTADO_MAP['PENDIENTE'];
  }

  etiquetaBoton(e: EstadoPedido): string {
    return e === 'ENTREGADO' ? 'Entregado sin novedad' : ESTADO_MAP[e].label;
  }

  destino(p: Pedido): string {
    return urlDestino(p);
  }

  urlTel(tel: string): string {
    return 'tel:' + tel.replace(/[^\d+]/g, '');
  }
}