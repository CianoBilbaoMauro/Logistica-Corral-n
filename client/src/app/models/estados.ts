import type { EstadoPedido } from './logistica.model';

export type Tono = 'gris' | 'ambar' | 'azul' | 'violeta' | 'naranja' | 'turquesa' | 'verde' | 'rojo';

export interface EstadoInfo {
  clave: EstadoPedido;
  label: string;
  tono: Tono;
}

export const ESTADOS: EstadoInfo[] = [
  { clave: 'PENDIENTE',         label: 'Sin notificar',          tono: 'ambar' },
  { clave: 'NOTIFICADO',        label: 'Notificado',             tono: 'azul' },
  { clave: 'NOTIFICADO_PREVIO', label: 'Notificado previamente', tono: 'azul' },
  { clave: 'EN_PREPARACION',    label: 'En preparación',         tono: 'violeta' },
  { clave: 'EN_CAMINO',         label: 'En camino',              tono: 'naranja' },
  { clave: 'LLEGA_PRONTO',      label: 'Llega pronto',           tono: 'turquesa' },
  { clave: 'REPROGRAMADO',      label: 'Reprogramado',           tono: 'gris' },
  { clave: 'ENTREGADO',         label: 'Entregado',              tono: 'verde' },
  { clave: 'CON_NOVEDAD',       label: 'Con novedad',            tono: 'rojo' },
];

export const ESTADO_MAP = Object.fromEntries(
  ESTADOS.map(e => [e.clave, e])
) as Record<EstadoPedido, EstadoInfo>;

export const FRANJAS: Record<string, string> = {
  MANANA: 'Mañana, 8:30 a 12:30',
  TARDE: 'Tarde, 13:30 a 16:30',
};  