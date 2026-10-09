import type { EstadoPedido } from './pedido.model.js';

export type EstadoAviso = 'PENDIENTE' | 'ENVIADO' | 'DESCARTADO';

export interface Aviso {
  id: string;
  pedidoId: string;
  estado: EstadoPedido;       // estado del pedido que originó el aviso
  mensaje: string;
  estadoAviso: EstadoAviso;
  creadoEn: string;
  resueltoEn?: string;
}

// Lo que ve el front: el aviso más los datos actuales del pedido
export interface AvisoPendiente extends Aviso {
  clienteNombre: string;
  telefono: string | null;    // null si no se pudo normalizar
}   