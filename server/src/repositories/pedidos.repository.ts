import { pedidosMock, setPedidosMock } from '../data/pedidos.mock.js';
import type { Pedido, EstadoPedido } from '../models/pedido.model.js';

export interface FiltroPedidos {
  zonaId?: string;
  estado?: EstadoPedido;
  desde?: string; // YYYY-MM-DD, incluida
  hasta?: string; // YYYY-MM-DD, incluida
  q?: string;     // texto libre: cliente, teléfono o dirección
}

const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function coincideBusqueda(p: Pedido, q: string): boolean {
  const texto = sinAcentos(`${p.clienteNombre} ${p.direccion}`);
  const tel = (p.clienteTelefono ?? '').replace(/\D/g, '');

  // Si lo escrito parece un teléfono (con espacios o guiones), se compara con los dígitos
  if (/^[\d\s\-()+]+$/.test(q)) {
    const digitos = q.replace(/\D/g, '');
    if (digitos.length >= 3 && tel.includes(digitos)) return true;
  }

  // Cada palabra tiene que aparecer en el nombre, la dirección o el teléfono
  return sinAcentos(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => {
      if (texto.includes(t)) return true;
      const digitos = t.replace(/\D/g, '');
      return digitos.length >= 3 && tel.includes(digitos);
    });
}

export class PedidosRepository {
  obtenerTodos(filtro: FiltroPedidos = {}) {
    const { zonaId, estado, desde, hasta, q } = filtro;
    let resultado = pedidosMock;
    if (zonaId) resultado = resultado.filter((p) => p.zonaId === zonaId);
    if (estado) resultado = resultado.filter((p) => p.estado === estado);
    // Con filtro de fechas, los pedidos sin fecha programada quedan afuera
    if (desde) resultado = resultado.filter((p) => !!p.fechaProgramada && p.fechaProgramada >= desde);
    if (hasta) resultado = resultado.filter((p) => !!p.fechaProgramada && p.fechaProgramada <= hasta);
    if (q) resultado = resultado.filter((p) => coincideBusqueda(p, q));
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