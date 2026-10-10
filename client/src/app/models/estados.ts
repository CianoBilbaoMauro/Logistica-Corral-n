import type { EstadoPedido } from './logistica.model';

export type Tono = 'gris' | 'ambar' | 'azul' | 'violeta' | 'naranja' | 'turquesa' | 'verde' | 'rojo';

export interface EstadoInfo {
  clave: EstadoPedido;
  label: string;
  tono: Tono;
}

export const ESTADOS: EstadoInfo[] = [
  { clave: 'PENDIENTE',      label: 'Sin notificar',  tono: 'ambar' },
  { clave: 'NOTIFICADO',     label: 'Notificado',     tono: 'azul' },
  { clave: 'EN_PREPARACION', label: 'En preparación', tono: 'violeta' },
  { clave: 'EN_CAMINO',      label: 'En camino',      tono: 'naranja' },
  { clave: 'ENTREGADO',      label: 'Entregado',      tono: 'verde' },
  { clave: 'CON_NOVEDAD',    label: 'Con novedad',    tono: 'rojo' },
  { clave: 'REPROGRAMADO',   label: 'Reprogramado',   tono: 'gris' },
];

export const ESTADO_MAP = Object.fromEntries(
  ESTADOS.map(e => [e.clave, e])
) as Record<EstadoPedido, EstadoInfo>;

// Estados que el admin puede elegir en el desplegable
export const ESTADOS_ADMIN: EstadoPedido[] = [
  'PENDIENTE',
  'NOTIFICADO',
  'EN_PREPARACION',
  'EN_CAMINO',
  'ENTREGADO',
  'CON_NOVEDAD',
  'REPROGRAMADO',
];

// Estados que piden un comentario al asignarlos
export const ESTADOS_CON_COMENTARIO: EstadoPedido[] = ['CON_NOVEDAD', 'REPROGRAMADO'];

export const FRANJAS: Record<string, string> = {
  MANANA: 'Mañana, 8:30 a 12:30',
  TARDE: 'Tarde, 12:30 a 16:30',
};