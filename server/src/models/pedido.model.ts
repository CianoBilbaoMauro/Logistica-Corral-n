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

export const TIPOS_COMPROBANTE = ['FACTURA_A', 'FACTURA_B', 'CONSUMIDOR_FINAL'] as const;
export type TipoComprobante = (typeof TIPOS_COMPROBANTE)[number];

export const CONDICIONES_PAGO = ['CONTADO', 'CTA_CTE'] as const;
export type CondicionPago = (typeof CONDICIONES_PAGO)[number];

export const EMISORES = ['GABARAIN', 'MATERIALES'] as const;
export type Emisor = (typeof EMISORES)[number];

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
  ubicacionUrl?: string;         // enlace de Google Maps o coordenadas
  tipoComprobante?: TipoComprobante;
  condicionPago?: CondicionPago;
  emisor?: Emisor;               // empresa que factura
  nroFactura?: string;           // para ubicar el comprobante en papel
  novedad?: string;              // comentario cuando el estado es CON_NOVEDAD o REPROGRAMADO
  estadoActualizadoEn?: string;  // fecha y hora (ISO) del último cambio de estado
}