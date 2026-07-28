export type EstadoHojaDeRuta = 'BORRADOR' | 'EN_PROCESO' | 'FINALIZADA';

export interface HojaDeRuta {
  id: string;
  fecha: string;
  zonaId: string;
  camioneroNombre?: string;
  pedidosIds: string[];
  estado: EstadoHojaDeRuta;
  observaciones?: string;
}