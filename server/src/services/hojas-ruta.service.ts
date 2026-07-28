import { HojasRutaRepository } from '../repositories/hojas-ruta.repository.js';
import type { HojaDeRuta, EstadoHojaDeRuta } from '../models/hoja-ruta.model.js';

const repository = new HojasRutaRepository();

export class HojasRutaService {
  obtenerHojas(fecha?: string, zonaId?: string, estado?: EstadoHojaDeRuta) {
    return repository.obtenerTodas(fecha, zonaId, estado);
  }

  obtenerPorId(id: string) {
    return repository.buscarPorId(id);
  }

  crearHoja(datos: Omit<HojaDeRuta, 'id' | 'estado'>) {
    const nuevaHoja: HojaDeRuta = {
      id: `hr${Date.now()}`,
      estado: 'BORRADOR',
      ...datos,
    };
    return repository.crear(nuevaHoja);
  }

  actualizarHoja(id: string, datos: Partial<HojaDeRuta>) {
    const hoja = repository.buscarPorId(id);
    if (!hoja) {
      throw new Error('Hoja de ruta no encontrada');
    }

    const actualizada = { ...hoja, ...datos };
    return repository.actualizar(actualizada);
  }
}