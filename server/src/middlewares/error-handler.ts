import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};