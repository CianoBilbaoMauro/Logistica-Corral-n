import { Router } from 'express';
import {
  obtenerHojas, obtenerHojaPorId, crearHoja, actualizarHoja,
} from '../controllers/hojas-ruta.controller.js';
import { validarBody } from '../middlewares/validar.js';
import { crearHojaSchema, actualizarHojaSchema } from '../schemas/hoja-ruta.schema.js';

const router = Router();

router.get('/', obtenerHojas);
router.get('/:id', obtenerHojaPorId);
router.post('/', validarBody(crearHojaSchema), crearHoja);
router.patch('/:id', validarBody(actualizarHojaSchema), actualizarHoja);

export default router;