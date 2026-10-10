export type EstadoPedido =
  | 'PENDIENTE'
  | 'NOTIFICADO'
  | 'EN_PREPARACION'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CON_NOVEDAD'
  | 'REPROGRAMADO';

export type FranjaHoraria = 'MANANA' | 'TARDE';

export interface Zona {
  id: string;
  nombre: string;
  diasSugeridos?: string[];
}

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
  novedad?: string;
  estadoActualizadoEn?: string;
}

export interface Aviso {
  id: string;
  pedidoId: string;
  estado: EstadoPedido;
  mensaje: string;
  clienteNombre: string;
  telefono: string | null;
  creadoEn: string;
}

export interface HojaDeRuta {
  id: string;
  fecha: string;
  zonaId: string;
  camioneroNombre?: string;
  pedidosIds: string[];
  estado?: 'BORRADOR' | 'EN_PROCESO' | 'FINALIZADA';
  observaciones?: string;
}