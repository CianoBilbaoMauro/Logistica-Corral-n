import { Router } from 'express';
import {
  obtenerPedidos,
  crearPedido,
  actualizarEstadoPedido,
} from '../controllers/pedidos.controller.js';

const router = Router();

router.get('/', obtenerPedidos);
router.post('/', crearPedido);
router.patch('/:id/estado', actualizarEstadoPedido);

export default router;