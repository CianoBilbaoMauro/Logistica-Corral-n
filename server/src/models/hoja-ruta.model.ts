export const ESTADOS_HOJA = ['BORRADOR', 'EN_PROCESO', 'FINALIZADA'] as const;

export type EstadoHojaDeRuta = (typeof ESTADOS_HOJA)[number];

export interface HojaDeRuta {
  id: string;
  fecha: string;
  zonaId: string;
  camioneroNombre?: string;
  pedidosIds: string[];
  estado: EstadoHojaDeRuta;
  observaciones?: string;
}