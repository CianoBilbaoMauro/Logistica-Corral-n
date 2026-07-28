import { PedidosRepository } from '../repositories/pedidos.repository.js';
import type { Pedido, EstadoPedido } from '../models/pedido.model.js';

const repository = new PedidosRepository();

export class PedidosService {
  obtenerPedidos(zonaId?: string, estado?: EstadoPedido) {
    return repository.obtenerTodos(zonaId, estado);
  }

  crearPedido(datos: Omit<Pedido, 'id' | 'estado'>) {
    const nuevoPedido: Pedido = {
      id: `p${Date.now()}`,
      estado: 'PENDIENTE',
      ...datos,
    };

    return repository.crear(nuevoPedido);
  }

  actualizarEstado(id: string, datos: Partial<Pedido>) {
    const pedido = repository.buscarPorId(id);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    const actualizado = { ...pedido, ...datos };

    return repository.actualizar(actualizado);
  }
}