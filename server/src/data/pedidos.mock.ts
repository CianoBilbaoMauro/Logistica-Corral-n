import type { Pedido } from '../types/index.js';

export let pedidosMock: Pedido[] = [
  {
    id: 'p1',
    clienteNombre: 'Gonzalo Pérez',
    clienteTelefono: '2291400001',
    direccion: 'Calle 21 N° 1420 (Centro)',
    zonaId: 'z1',
    estado: 'PENDIENTE',
  },
  {
    id: 'p2',
    clienteNombre: 'Estela Gómez',
    clienteTelefono: '2291400002',
    direccion: 'Calle 40 esquina 5 (Parquemar)',
    zonaId: 'z2',
    estado: 'PENDIENTE',
  }
];  

export const setPedidosMock = (pedidos: Pedido[]) => {
  pedidosMock = pedidos;
};