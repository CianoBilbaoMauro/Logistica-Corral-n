import { Router } from 'express';
import {
  obtenerHojas,
  obtenerHojaPorId,
  crearHoja,
  actualizarHoja,
} from '../controllers/hojas-ruta.controller.js';

const router = Router();

router.get('/', obtenerHojas);
router.get('/:id', obtenerHojaPorId);
router.post('/', crearHoja);
router.patch('/:id', actualizarHoja);

export default router;