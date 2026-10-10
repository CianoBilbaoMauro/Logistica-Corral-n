import { randomUUID } from 'node:crypto';
import { PedidosRepository, type FiltroPedidos } from '../repositories/pedidos.repository.js';
import { ZonasRepository } from '../repositories/zonas.repository.js';
import { AvisosService } from './avisos.service.js';
import { AppError, NotFoundError } from '../errors/app-error.js';
import type { Pedido } from '../models/pedido.model.js';
import type { DatosPedido, DatosCambioEstado } from '../schemas/pedido.schema.js';

const repository = new PedidosRepository();
const zonas = new ZonasRepository();
const avisos = new AvisosService();

export class PedidosService {
  obtenerPedidos(filtro: FiltroPedidos = {}) {
    return repository.obtenerTodos(filtro);
  }

  obtenerPorId(id: string) {
    return repository.buscarPorId(id);
  }

  crearPedido(datos: DatosPedido): Pedido {
    this.verificarZona(datos.zonaId);
    const nuevo: Pedido = {
      ...datos,
      id: randomUUID(),
      estado: 'PENDIENTE', // siempre arranca así, el cliente no lo elige
      estadoActualizadoEn: new Date().toISOString(),
    };
    return repository.crear(nuevo);
  }

  // Cambia el estado, guarda el comentario y el momento del cambio, y genera el aviso al cliente
  actualizarEstado(id: string, datos: DatosCambioEstado): Pedido {
    const { estado, comentario } = datos;
    const pedido = repository.buscarPorId(id);
    if (!pedido) throw new NotFoundError('Pedido no encontrado');

    // Mismo estado y sin comentario nuevo: no hay nada que cambiar ni avisar
    if (pedido.estado === estado && !comentario) return pedido;

    // El comentario solo vive mientras el estado sea CON_NOVEDAD o REPROGRAMADO
    const admiteNota = estado === 'CON_NOVEDAD' || estado === 'REPROGRAMADO';
    const { novedad: _anterior, ...resto } = pedido;
    const actualizado = repository.actualizar({
      ...resto,
      estado,
      estadoActualizadoEn: new Date().toISOString(),
      ...(admiteNota && comentario ? { novedad: comentario } : {}),
    });

    // Si falla el aviso, el cambio de estado igual queda guardado
    try {
      avisos.generarPara(actualizado);
    } catch (error) {
      console.error('No se pudo generar el aviso', error);
    }
    return actualizado;
  }

  // Reemplaza los datos editables; id, estado, novedad y hora del último cambio se conservan
  actualizarCompleto(id: string, datos: DatosPedido): Pedido {
    const pedido = repository.buscarPorId(id);
    if (!pedido) throw new NotFoundError('Pedido no encontrado');
    this.verificarZona(datos.zonaId);
    return repository.actualizar({
      ...datos,
      id: pedido.id,
      estado: pedido.estado,
      ...(pedido.novedad ? { novedad: pedido.novedad } : {}),
      ...(pedido.estadoActualizadoEn ? { estadoActualizadoEn: pedido.estadoActualizadoEn } : {}),
    });
  }

  eliminarPedido(id: string): void {
    if (!repository.eliminar(id)) throw new NotFoundError('Pedido no encontrado');
    avisos.descartarDePedido(id);
  }

  private verificarZona(zonaId: string) {
    if (!zonas.buscarPorId(zonaId)) throw new AppError('La zona indicada no existe', 400);
  }
}