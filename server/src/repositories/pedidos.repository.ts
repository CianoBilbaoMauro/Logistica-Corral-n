import { pedidosMock, setPedidosMock } from '../data/pedidos.mock.js';
import type { Pedido, EstadoPedido } from '../models/pedido.model.js';

export class PedidosRepository {
  obtenerTodos(zonaId?: string, estado?: EstadoPedido) {
    let resultado = pedidosMock;
    if (zonaId) resultado = resultado.filter((p) => p.zonaId === zonaId);
    if (estado) resultado = resultado.filter((p) => p.estado === estado);
    return resultado;
  }

  buscarPorId(id: string) {
    return pedidosMock.find((p) => p.id === id);
  }

  crear(pedido: Pedido) {
    pedidosMock.push(pedido);
    return pedido;
  }

  actualizar(pedidoActualizado: Pedido) {
    const nuevos = pedidosMock.map((p) => p.id === pedidoActualizado.id ? pedidoActualizado : p);
    setPedidosMock(nuevos);
    return pedidoActualizado;
  }

  eliminar(id: string) {
    const existe = pedidosMock.some((p) => p.id === id);
    if (!existe) return false;
    const nuevos = pedidosMock.filter((p) => p.id !== id);
    setPedidosMock(nuevos);
    return true;
  }
}