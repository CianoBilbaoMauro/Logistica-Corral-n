export type EstadoPedido =
  | 'PENDIENTE'
  | 'NOTIFICADO'
  | 'NOTIFICADO_PREVIO'
  | 'EN_PREPARACION'
  | 'EN_CAMINO'
  | 'LLEGA_PRONTO'
  | 'REPROGRAMADO'
  | 'ENTREGADO'
  | 'CON_NOVEDAD';

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
  camioneroNombre?: string; // para que ande tu tarjeta
}