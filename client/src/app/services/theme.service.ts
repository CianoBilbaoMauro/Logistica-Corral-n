import { Injectable, signal } from '@angular/core';

const CLAVE = 'tema_gabarain';

// Modo claro/oscuro: se recuerda entre visitas y, la primera vez, respeta la preferencia del sistema
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly oscuro = signal(false);

  constructor() {
    this.oscuro.set(this.leerInicial());
    this.aplicar();
  }

  alternar(): void {
    this.oscuro.update((v) => !v);
    this.aplicar();
    try {
      localStorage.setItem(CLAVE, this.oscuro() ? 'oscuro' : 'claro');
    } catch { /* sin almacenamiento: funciona igual, solo no lo recuerda */ }
  }

  private leerInicial(): boolean {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === 'oscuro') return true;
      if (guardado === 'claro') return false;
    } catch { /* se ignora */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private aplicar(): void {
    document.body.classList.toggle('dark-theme', this.oscuro());
  }
}