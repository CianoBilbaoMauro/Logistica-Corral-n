import { randomUUID } from 'node:crypto';
import { HojasRutaRepository } from '../repositories/hojas-ruta.repository.js';
import { PedidosRepository } from '../repositories/pedidos.repository.js';
import { ZonasRepository } from '../repositories/zonas.repository.js';
import { AppError, NotFoundError } from '../errors/app-error.js';
import type { HojaDeRuta, EstadoHojaDeRuta } from '../models/hoja-ruta.model.js';
import type { DatosHojaNueva, DatosHojaEdicion } from '../schemas/hoja-ruta.schema.js';

const repository = new HojasRutaRepository();
const pedidos = new PedidosRepository();
const zonas = new ZonasRepository();

export class HojasRutaService {
  obtenerHojas(fecha?: string, zonaId?: string, estado?: EstadoHojaDeRuta) {
    return repository.obtenerTodas(fecha, zonaId, estado);
  }

  obtenerPorId(id: string) {
    return repository.buscarPorId(id);
  }

  crearHoja(datos: DatosHojaNueva): HojaDeRuta {
    this.verificarZona(datos.zonaId);
    this.verificarPedidos(datos.pedidosIds);
    return repository.crear({
      ...datos,
      id: randomUUID(),
      estado: 'BORRADOR', // siempre arranca así
    });
  }

  actualizarHoja(id: string, datos: DatosHojaEdicion): HojaDeRuta {
    const hoja = repository.buscarPorId(id);
    if (!hoja) throw new NotFoundError('Hoja de ruta no encontrada');

    if (datos.zonaId) this.verificarZona(datos.zonaId);
    if (datos.pedidosIds) this.verificarPedidos(datos.pedidosIds);

    return repository.actualizar({ ...hoja, ...datos, id: hoja.id });
  }

  private verificarZona(zonaId: string) {
    if (!zonas.buscarPorId(zonaId)) throw new AppError('La zona indicada no existe', 400);
  }

  private verificarPedidos(ids: string[]) {
    const unicos = new Set(ids);
    if (unicos.size !== ids.length) throw new AppError('Hay pedidos repetidos en la hoja', 400);
    for (const id of unicos) {
      if (!pedidos.buscarPorId(id)) throw new AppError(`El pedido ${id} no existe`, 400);
    }
  }
}