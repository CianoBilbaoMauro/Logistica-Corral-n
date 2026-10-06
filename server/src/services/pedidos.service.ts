import { PedidosRepository } from '../repositories/pedidos.repository.js';
import type { Pedido, EstadoPedido } from '../models/pedido.model.js';

const repository = new PedidosRepository();

export class PedidosService {
  obtenerPedidos(zonaId?: string, estado?: EstadoPedido) {
    return repository.obtenerTodos(zonaId, estado);
  }

  obtenerPorId(id: string) {
    return repository.buscarPorId(id);
  }

  crearPedido(datos: Omit<Pedido, 'id'>) {
    const nuevoPedido: Pedido = {
      id: `p${Date.now()}`,
      estado: 'PENDIENTE',
      ...datos,
    } as Pedido;
    return repository.crear(nuevoPedido);
  }

  actualizarEstado(id: string, datos: { estado: EstadoPedido } | Partial<Pedido>) {
    const pedido = repository.buscarPorId(id);
    if (!pedido) throw new Error('Pedido no encontrado');
    const estado = (datos as any).estado ? (datos as any).estado : (datos as Pedido).estado;
    const actualizado = { ...pedido, estado, ...datos };
    return repository.actualizar(actualizado as Pedido);
  }

  actualizarCompleto(id: string, datos: Partial<Pedido>) {
    const pedido = repository.buscarPorId(id);
    if (!pedido) throw new Error('Pedido no encontrado');
    const actualizado = { ...pedido, ...datos };
    return repository.actualizar(actualizado);
  }

  eliminarPedido(id: string) {
    const ok = repository.eliminar(id);
    if (!ok) throw new Error('Pedido no encontrado');
    return ok;
  }
}