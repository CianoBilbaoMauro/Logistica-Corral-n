import { ZonasRepository } from '../repositories/zonas.repository.js';
import type { Zona } from '../models/zona.model.js';

const repository = new ZonasRepository();

export class ZonasService {
  obtenerZonas(): Zona[] {
    return repository.obtenerTodas();
  }

  obtenerZonaPorId(id: string): Zona | undefined {
    return repository.buscarPorId(id);
  }
}