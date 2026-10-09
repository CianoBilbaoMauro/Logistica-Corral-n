import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, interval, of } from 'rxjs';
import { catchError, filter, finalize, switchMap, tap } from 'rxjs/operators';
import { PedidosService } from '../services/pedidos';
import { Zona, Pedido, EstadoPedido } from '../models/logistica.model';
import { ESTADOS, ESTADO_MAP, FRANJAS } from '../models/estados';

const ZONA_KEY = 'zona_camionero';
const POLLING_MS = 10_000;

// Estados que el camionero NO ve en su lista
const OCULTOS: EstadoPedido[] = ['PENDIENTE', 'ENTREGADO'];
// Estados que el camionero puede asignar
const PERMITIDOS: EstadoPedido[] = ['EN_CAMINO', 'LLEGA_PRONTO', 'ENTREGADO', 'CON_NOVEDAD', 'REPROGRAMADO'];

@Component({
  selector: 'app-camionero',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './camionero.component.html',
  styleUrl: './camionero.component.css'
})
export class CamioneroComponent implements OnInit {
  private service = inject(PedidosService);
  private destroyRef = inject(DestroyRef);
  private cargar$ = new Subject<{ zona: string; spinner: boolean }>();

  // Signals: la pantalla se actualiza sola, con o sin zone.js
  zonas = signal<Zona[]>([]);
  pedidos = signal<Pedido[]>([]);
  zonaSeleccionada = signal(localStorage.getItem(ZONA_KEY) || '');
  cargando = signal(false);
  error = signal<string | null>(null);
  actualizando = signal<Set<string>>(new Set());

  estados = ESTADOS.filter(e => PERMITIDOS.includes(e.clave));
  franjas = FRANJAS;

  ngOnInit() {
    // switchMap cancela la request anterior si llega una nueva (zona distinta o polling)
    this.cargar$.pipe(
      tap(({ spinner }) => { if (spinner) { this.cargando.set(true); this.error.set(null); } }),
      switchMap(({ zona }) => zona
        ? this.service.getPedidos(zona).pipe(catchError(() => of(null)))
        : of([] as Pedido[])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(pedidos => {
      this.cargando.set(false);
      if (pedidos === null) {
        this.error.set('No pudimos actualizar tus entregas. Se reintenta solo.');
        return;
      }
      if (this.actualizando().size) return; // no pisar un cambio de estado en curso
      this.error.set(null);
      this.pedidos.set(pedidos.filter(p => !OCULTOS.includes(p.estado)));
    });

    this.service.getZonas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(zonas => {
      this.zonas.set(zonas);
      const existe = zonas.some(z => String(z.id) === this.zonaSeleccionada());
      if (this.zonaSeleccionada() && !existe) this.onZonaChange('');
    });

    // Refresca solo (pausa si la pestaña está oculta)
    interval(POLLING_MS).pipe(
      filter(() => !!this.zonaSeleccionada() && document.visibilityState === 'visible'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.cargar$.next({ zona: this.zonaSeleccionada(), spinner: false }));

    if (this.zonaSeleccionada()) {
      this.cargar$.next({ zona: this.zonaSeleccionada(), spinner: true });
    }
  }

  onZonaChange(zona: string) {
    this.zonaSeleccionada.set(zona);
    if (zona) localStorage.setItem(ZONA_KEY, zona);
    else localStorage.removeItem(ZONA_KEY);
    this.pedidos.set([]);
    this.error.set(null);
    this.cargar$.next({ zona, spinner: !!zona });
  }

  cambiarEstado(p: Pedido, estado: EstadoPedido) {
    if (p.estado === estado || this.actualizando().has(p.id)) return;

    const anterior = p.estado;
    this.setEstado(p.id, estado);      // actualización optimista
    this.marcar(p.id, true);

    this.service.actualizarEstado(p.id, estado)
      .pipe(finalize(() => this.marcar(p.id, false)))
      .subscribe({
        next: res => {
          this.setEstado(p.id, res.estado);
          if (OCULTOS.includes(res.estado)) {
            setTimeout(() => this.pedidos.update(l => l.filter(x => x.id !== p.id)), 600);
          }
        },
        error: () => {
          this.setEstado(p.id, anterior); // rollback
          this.error.set('No se pudo cambiar el estado. Probá de nuevo.');
        }
      });
  }

  private setEstado(id: string, estado: EstadoPedido) {
    this.pedidos.update(l => l.map(x => x.id === id ? { ...x, estado } : x));
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

  urlMapa(dir: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;
  }

  urlTel(tel: string): string {
    return 'tel:' + tel.replace(/[^\d+]/g, '');
  }
}