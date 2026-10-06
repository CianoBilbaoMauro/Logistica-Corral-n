export type EstadoPedido = 
  | 'PENDIENTE'
  | 'NOTIFICADO'
  | 'EN_PREPARACION' 
  | 'EN_CAMINO' 
  | 'LLEGA_PRONTO' 
  | 'REPROGRAMADO' 
  | 'ENTREGADO'
  | 'CON_NOVEDAD';

export type FranjaHoraria = 'MANANA' | 'TARDE' | string;

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
}

export interface HojaDeRuta {
  id: string;
  fecha: string;
  zonaId: string;
  camioneroNombre: string;
  pedidosIds: string[];
}