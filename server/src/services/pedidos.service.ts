import { randomUUID } from 'node:crypto';
import { PedidosRepository } from '../repositories/pedidos.repository.js';
import { ZonasRepository } from '../repositories/zonas.repository.js';
import { AvisosService } from './avisos.service.js';
import { AppError, NotFoundError } from '../errors/app-error.js';
import type { Pedido, EstadoPedido } from '../models/pedido.model.js';
import type { DatosPedido } from '../schemas/pedido.schema.js';

const repository = new PedidosRepository();
const zonas = new ZonasRepository();
const avisos = new AvisosService();

export class PedidosService {
  obtenerPedidos(zonaId?: string, estado?: EstadoPedido) {
    return repository.obtenerTodos(zonaId, estado);
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
    };
    return repository.crear(nuevo);
  }

  // Cambia SOLO el estado y genera el aviso al cliente
  actualizarEstado(id: string, estado: EstadoPedido): Pedido {
    const pedido = repository.buscarPorId(id);
    if (!pedido) throw new NotFoundError('Pedido no encontrado');
    if (pedido.estado === estado) return pedido; // sin cambio, sin aviso duplicado

    const actualizado = repository.actualizar({ ...pedido, estado });

    // Si falla el aviso, el cambio de estado igual queda guardado
    try {
      avisos.generarPara(actualizado);
    } catch (error) {
      console.error('No se pudo generar el aviso', error);
    }
    return actualizado;
  }

  // Reemplaza los datos editables; id y estado se conservan
  actualizarCompleto(id: string, datos: DatosPedido): Pedido {
    const pedido = repository.buscarPorId(id);
    if (!pedido) throw new NotFoundError('Pedido no encontrado');
    this.verificarZona(datos.zonaId);
    return repository.actualizar({ ...datos, id: pedido.id, estado: pedido.estado });
  }

  eliminarPedido(id: string): void {
    if (!repository.eliminar(id)) throw new NotFoundError('Pedido no encontrado');
    avisos.descartarDePedido(id);
  }

  private verificarZona(zonaId: string) {
    if (!zonas.buscarPorId(zonaId)) throw new AppError('La zona indicada no existe', 400);
  }
}