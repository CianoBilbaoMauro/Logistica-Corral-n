import { Injectable, signal } from '@angular/core';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  peligro?: boolean;
}

interface Pendiente extends OpcionesConfirmacion {
  resolver: (aceptado: boolean) => void;
}

// Cuadro de confirmación propio (reemplaza a confirm()). Uso: if (await confirmacion.pedir({...})) { ... }
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private readonly _actual = signal<Pendiente | null>(null);
  readonly actual = this._actual.asReadonly();

  pedir(opciones: OpcionesConfirmacion): Promise<boolean> {
    this._actual()?.resolver(false); // si había otro abierto, se cancela
    return new Promise<boolean>((resolver) => this._actual.set({ ...opciones, resolver }));
  }

  responder(aceptado: boolean): void {
    const pendiente = this._actual();
    if (!pendiente) return;
    this._actual.set(null);
    pendiente.resolver(aceptado);
  }
}