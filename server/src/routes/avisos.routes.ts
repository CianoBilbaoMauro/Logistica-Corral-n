import { Router } from 'express';
import {
  obtenerAvisosPendientes, marcarAvisoEnviado, descartarAviso,
} from '../controllers/avisos.controller.js';

const router = Router();

router.get('/', obtenerAvisosPendientes);
router.patch('/:id/enviado', marcarAvisoEnviado);
router.patch('/:id/descartado', descartarAviso);

export default router;