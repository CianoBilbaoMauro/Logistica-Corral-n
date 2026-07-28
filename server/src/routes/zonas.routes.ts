import { Router } from 'express';
import { obtenerZonas, obtenerZonaPorId } from '../controllers/zonas.controller.js';

const router = Router();

router.get('/', obtenerZonas);
router.get('/:id', obtenerZonaPorId);

export default router;