import { Router } from 'express';
import { obtenerPedidos, crearPedido, actualizarEstadoPedido, actualizarPedido, eliminarPedido, obtenerPedidoPorId } from '../controllers/pedidos.controller.js';

const router = Router();
router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.post('/', crearPedido);
router.patch('/:id/estado', actualizarEstadoPedido);
router.put('/:id', actualizarPedido);
router.delete('/:id', eliminarPedido);

export default router;