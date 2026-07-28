// src/controllers/pedidos.controller.ts
import type { Request, Response } from 'express';
import { PedidosService } from '../services/pedidos.service.js';
import type { EstadoPedido } from '../models/pedido.model.js';

const service = new PedidosService();

export const obtenerPedidos = (req: Request, res: Response) => {
  const zonaId =
    typeof req.query.zonaId === 'string'
      ? req.query.zonaId
      : undefined;

  const estado =
    typeof req.query.estado === 'string'
      ? (req.query.estado as EstadoPedido)
      : undefined;

  const pedidos = service.obtenerPedidos(zonaId, estado);

  res.json(pedidos);
};

export const crearPedido = (req: Request, res: Response) => {
  const pedido = service.crearPedido(req.body);

  res.status(201).json(pedido);
};

export const actualizarEstadoPedido = (
  req: Request,
  res: Response
) => {
  try {
    // 💡 APLICAMOS EL CASTING A STRING ACÁ PARA RESOLVER EL ERROR 2345
    const id = req.params.id as string;

    const pedido = service.actualizarEstado(
      id,
      req.body
    );

    res.json(pedido);
  } catch (error) {
    res.status(404).json({
      error:
        error instanceof Error
          ? error.message
          : 'Pedido no encontrado',
    });
  }
};