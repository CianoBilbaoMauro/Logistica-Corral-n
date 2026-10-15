import type { Pedido } from '../models/logistica.model';

const COORDENADAS = /^-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/;

// Localidad que se agrega a la búsqueda según la zona, para que Google no ubique la calle en otro pueblo.
// Ajustala con los ids de tus zonas.
const LOCALIDAD_POR_ZONA: Record<string, string> = {
  z1: 'Miramar',
  z2: 'Miramar',
  z3: 'Mar del Sur',
  z4: 'Marquesado',
  z5: 'Mechongué',
};
const LOCALIDAD_POR_DEFECTO = 'Miramar';

// Acepta coordenadas o un enlace de Google Maps (https). Es la misma regla que valida el servidor.
export function esUbicacionValida(valor: string): boolean {
  const v = valor.trim();
  if (COORDENADAS.test(v)) return true;
  try {
    const url = new URL(v);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'maps.app.goo.gl' || host === 'maps.google.com') return true;
    if (host === 'goo.gl') return url.pathname.startsWith('/maps');
    return /^(www\.)?google\.com(\.ar)?$/.test(host) && url.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}

// Enlace de "Cómo llegar": usa la ubicación exacta si está cargada y, si no, la dirección más la localidad
export function urlDestino(p: Pick<Pedido, 'direccion' | 'zonaId' | 'ubicacionUrl'>): string {
  const ubicacion = p.ubicacionUrl?.trim();

  if (ubicacion) {
    if (COORDENADAS.test(ubicacion)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ubicacion.replace(/\s+/g, ''))}`;
    }
    return ubicacion;
  }

  const localidad = LOCALIDAD_POR_ZONA[p.zonaId] ?? LOCALIDAD_POR_DEFECTO;
  const destino = `${p.direccion}, ${localidad}, Buenos Aires, Argentina`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}