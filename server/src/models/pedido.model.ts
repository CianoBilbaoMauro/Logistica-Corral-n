export type EstadoPedido =
  | 'PENDIENTE'
  | 'NOTIFICADO_PREVIO'
  | 'EN_CAMINO'
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
}