import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

// Valida y reemplaza el body por la versión limpia. Si falla, lo atiende el errorHandler.
export const validarBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };