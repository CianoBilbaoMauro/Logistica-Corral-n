import { Component, HostListener, inject } from '@angular/core';
import { ConfirmacionService } from '../../services/confirmacion.service';
import { ThemeService } from '../../services/theme.service';
import { TipoToast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toast.lista(); track t.id) {
        <div class="toast" [attr.data-tipo]="t.tipo" [attr.role]="t.tipo === 'error' ? 'alert' : 'status'">
          <svg class="ico"><use [attr.href]="icono(t.tipo)" /></svg>
          <span class="mensaje">{{ t.mensaje }}</span>
          <button type="button" class="cerrar" (click)="toast.cerrar(t.id)" aria-label="Cerrar aviso">
            <svg class="ico"><use href="#i-x" /></svg>
          </button>
        </div>
      }
    </div>

    @if (confirmacion.actual(); as c) {
      <div class="velo" (click)="confirmacion.responder(false)">
        <div class="dialogo" role="alertdialog" aria-modal="true" aria-labelledby="dialogo-titulo"
             (click)="$event.stopPropagation()">
          <h2 id="dialogo-titulo">{{ c.titulo }}</h2>
          <p>{{ c.mensaje }}</p>
          <div class="acciones">
            <button type="button" class="btn-cancelar" (click)="confirmacion.responder(false)">Cancelar</button>
            <button type="button" class="btn-aceptar" [class.peligro]="c.peligro" (click)="confirmacion.responder(true)">
              {{ c.textoConfirmar ?? 'Aceptar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .toasts {
      position: fixed; top: 1rem; right: 1rem; z-index: 1000;
      display: grid; gap: .5rem; width: min(360px, calc(100vw - 2rem));
    }
    .toast {
      --color: #2563eb;
      display: flex; align-items: flex-start; gap: .6rem; padding: .7rem .8rem;
      background: var(--color-card-bg); color: var(--color-text-main);
      border: 1px solid var(--color-border-light); border-left: 4px solid var(--color);
      border-radius: 8px; box-shadow: 0 6px 20px rgba(0, 0, 0, .2); font-size: .9rem; line-height: 1.35;
    }
    .toast[data-tipo='exito'] { --color: #16a34a; }
    .toast[data-tipo='error'] { --color: #dc2626; }
    .toast > .ico { margin-top: 2px; color: var(--color); }
    .mensaje { flex: 1; }
    .cerrar {
      display: flex; padding: 2px; border: none; background: transparent; cursor: pointer;
      color: var(--color-text-muted);
    }
    .cerrar:hover { color: var(--color-text-main); }

    .velo {
      position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center;
      padding: 1rem; background: rgba(0, 0, 0, .5);
    }
    .dialogo {
      width: min(420px, 100%); padding: 1.4rem; border-radius: 12px;
      background: var(--color-card-bg); color: var(--color-text-main);
      border: 1px solid var(--color-border-light); box-shadow: 0 12px 40px rgba(0, 0, 0, .35);
    }
    .dialogo h2 { margin: 0 0 .5rem; font-size: 1.15rem; }
    .dialogo p { margin: 0 0 1.2rem; color: var(--color-text-muted); line-height: 1.45; }
    .acciones { display: flex; gap: .6rem; justify-content: flex-end; }
    .acciones button {
      min-height: 42px; padding: .5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;
    }
    .btn-cancelar { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-main); }
    .btn-aceptar { background: var(--color-primary); border: 1px solid var(--color-primary); color: #fff; }
    .btn-aceptar.peligro { background: #dc2626; border-color: #dc2626; }

    @media print { :host { display: none; } }
  `,
})
export class NotificacionesComponent {
  protected readonly toast = inject(ToastService);
  protected readonly confirmacion = inject(ConfirmacionService);

  constructor() {
    // Se instancia acá para que el tema guardado se aplique apenas arranca la app
    inject(ThemeService);
  }

  protected icono(tipo: TipoToast): string {
    return tipo === 'exito' ? '#i-check' : tipo === 'error' ? '#i-alert' : '#i-info';
  }

  @HostListener('document:keydown.escape')
  protected alApretarEscape(): void {
    if (this.confirmacion.actual()) this.confirmacion.responder(false);
  }
}