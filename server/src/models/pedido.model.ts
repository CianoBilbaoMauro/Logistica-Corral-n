export const ESTADOS_PEDIDO = [
  'PENDIENTE',
  'NOTIFICADO',
  'EN_PREPARACION',
  'EN_CAMINO',
  'ENTREGADO',
  'CON_NOVEDAD',
  'REPROGRAMADO',
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
  novedad?: string;              // comentario cuando el estado es CON_NOVEDAD o REPROGRAMADO
  estadoActualizadoEn?: string;  // fecha y hora (ISO) del último cambio de estado
}