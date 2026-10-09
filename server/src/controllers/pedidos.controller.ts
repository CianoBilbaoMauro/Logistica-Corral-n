import type { Request, Response } from 'express';
import { PedidosService } from '../services/pedidos.service.js';
import { NotFoundError } from '../errors/app-error.js';
import { filtroPedidosSchema } from '../schemas/pedido.schema.js';

const service = new PedidosService();

export const obtenerPedidos = (req: Request, res: Response) => {
  const { zonaId, estado } = filtroPedidosSchema.parse(req.query);
  res.json(service.obtenerPedidos(zonaId, estado));
};

export const obtenerPedidoPorId = (req: Request, res: Response) => {
  const pedido = service.obtenerPorId(req.params.id as string);
  if (!pedido) throw new NotFoundError('Pedido no encontrado');
  res.json(pedido);
};

export const crearPedido = (req: Request, res: Response) => {
  res.status(201).json(service.crearPedido(req.body));
};

export const actualizarEstadoPedido = (req: Request, res: Response) => {
  res.json(service.actualizarEstado(req.params.id as string, req.body.estado));
};

export const actualizarPedido = (req: Request, res: Response) => {
  res.json(service.actualizarCompleto(req.params.id as string, req.body));
};

export const eliminarPedido = (req: Request, res: Response) => {
  service.eliminarPedido(req.params.id as string);
  res.json({ message: 'Pedido eliminado correctamente' });
};