import { zonasMock } from '../data/zonas.mock.js';
import type { Zona } from '../models/zona.model.js';

export class ZonasRepository {
  obtenerTodas(): Zona[] {
    return zonasMock;
  }

  buscarPorId(id: string): Zona | undefined {
    return zonasMock.find((z) => z.id === id);
  }
}