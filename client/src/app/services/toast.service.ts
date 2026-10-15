import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

const MAXIMO_VISIBLES = 4;

// Avisos breves en pantalla (reemplazan a alert())
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguienteId = 1;
  private readonly _lista = signal<Toast[]>([]);
  readonly lista = this._lista.asReadonly();

  exito(mensaje: string): void { this.mostrar('exito', mensaje, 3500); }
  info(mensaje: string): void { this.mostrar('info', mensaje, 4000); }
  error(mensaje: string): void { this.mostrar('error', mensaje, 6000); }

  cerrar(id: number): void {
    this._lista.update((l) => l.filter((t) => t.id !== id));
  }

  private mostrar(tipo: TipoToast, mensaje: string, ms: number): void {
    const id = this.siguienteId++;
    this._lista.update((l) => [...l.slice(-(MAXIMO_VISIBLES - 1)), { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), ms);
  }
}