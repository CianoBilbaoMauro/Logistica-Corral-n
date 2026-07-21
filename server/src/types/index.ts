export type EstadoPedido = 
  | 'PENDIENTE' 
  | 'NOTIFICADO_PREVIO' 
  | 'EN_CAMINO' 
  | 'ENTREGADO' 
  | 'CON_NOVEDAD';

export type FranjaHoraria = 'MANANA' | 'TARDE';

export interface Zona {
  id: string;
  nombre: string;
  diasSugeridos: string[];
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
}

export interface HojaDeRuta {
  id: string;
  fecha: string;
  zonaId: string;
  camioneroNombre: string;
  pedidosIds: string[];
}