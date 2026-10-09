import type { Request, Response } from 'express';
import { HojasRutaService } from '../services/hojas-ruta.service.js';
import { NotFoundError } from '../errors/app-error.js';
import { filtroHojasSchema } from '../schemas/hoja-ruta.schema.js';

const service = new HojasRutaService();

export const obtenerHojas = (req: Request, res: Response) => {
  const { fecha, zonaId, estado } = filtroHojasSchema.parse(req.query);
  res.json(service.obtenerHojas(fecha, zonaId, estado));
};

export const obtenerHojaPorId = (req: Request, res: Response) => {
  const hoja = service.obtenerPorId(req.params.id as string);
  if (!hoja) throw new NotFoundError('Hoja de ruta no encontrada');
  res.json(hoja);
};

export const crearHoja = (req: Request, res: Response) => {
  res.status(201).json(service.crearHoja(req.body));
};

export const actualizarHoja = (req: Request, res: Response) => {
  res.json(service.actualizarHoja(req.params.id as string, req.body));
};