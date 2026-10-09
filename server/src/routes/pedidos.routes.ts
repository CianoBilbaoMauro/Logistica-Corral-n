import { Router } from 'express';
import {
  obtenerPedidos, obtenerPedidoPorId, crearPedido,
  actualizarEstadoPedido, actualizarPedido, eliminarPedido,
} from '../controllers/pedidos.controller.js';
import { validarBody } from '../middlewares/validar.js';
import { pedidoSchema, cambiarEstadoSchema } from '../schemas/pedido.schema.js';

const router = Router();

router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.post('/', validarBody(pedidoSchema), crearPedido);
router.patch('/:id/estado', validarBody(cambiarEstadoSchema), actualizarEstadoPedido);
router.put('/:id', validarBody(pedidoSchema), actualizarPedido);
router.delete('/:id', eliminarPedido);

export default router;