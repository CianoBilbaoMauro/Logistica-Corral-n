export type EstadoPedido =
  | 'PENDIENTE'
  | 'NOTIFICADO'
  | 'EN_PREPARACION'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CON_NOVEDAD'
  | 'REPROGRAMADO';

export type FranjaHoraria = 'MANANA' | 'TARDE';

export type TipoComprobante = 'FACTURA_A' | 'FACTURA_B' | 'CONSUMIDOR_FINAL';
export type CondicionPago = 'CONTADO' | 'CTA_CTE';
export type Emisor = 'GABARAIN' | 'MATERIALES';

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
  ubicacionUrl?: string;         // enlace de Google Maps o coordenadas ("-38.27, -57.84")
  tipoComprobante?: TipoComprobante;
  condicionPago?: CondicionPago;
  emisor?: Emisor;               // empresa que factura
  nroFactura?: string;           // para ubicar el comprobante en papel
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