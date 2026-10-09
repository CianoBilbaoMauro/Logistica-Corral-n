export const ESTADOS_PEDIDO = [
  'PENDIENTE',
  'NOTIFICADO',
  'NOTIFICADO_PREVIO',
  'EN_PREPARACION',
  'EN_CAMINO',
  'LLEGA_PRONTO',
  'REPROGRAMADO',
  'ENTREGADO',
  'CON_NOVEDAD',
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type FranjaHoraria = 'MANANA' | 'TARDE';

export interface Pedido {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  direccion: string;
  zonaId: string;
  estado: EstadoPedido;
  franjaHoraria?: FranjaHoraria;
  fechaProgramada?: string;
  observacionEntrega?: string;
  camioneroNombre?: string;
}