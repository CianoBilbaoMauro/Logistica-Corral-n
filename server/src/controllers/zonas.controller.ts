import type { Request, Response } from 'express';
import { ZonasService } from '../services/zonas.service.js';

const service = new ZonasService();

export const obtenerZonas = (_req: Request, res: Response) => {
  const zonas = service.obtenerZonas();
  res.json(zonas);
};

export const obtenerZonaPorId = (req: Request, res: Response) => {
  const id = req.params.id as string;
  const zona = service.obtenerZonaPorId(id);

  if (!zona) {
    res.status(404).json({ error: 'Zona no encontrada' });
    return;
  }

  res.json(zona);
};