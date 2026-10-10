import { HttpErrorResponse } from '@angular/common/http';

// Convierte un error del servidor en un texto para mostrarle al usuario
export function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor.';
    const detalles = err.error?.detalles;
    if (Array.isArray(detalles) && detalles.length) {
      return detalles.map((d: { mensaje: string }) => d.mensaje).join(' · ');
    }
    if (typeof err.error?.error === 'string') return err.error.error;
  }
  return porDefecto;
}