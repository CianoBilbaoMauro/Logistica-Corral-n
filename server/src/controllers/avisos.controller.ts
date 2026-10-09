import type { Request, Response } from 'express';
import { AvisosService } from '../services/avisos.service.js';

const service = new AvisosService();

export const obtenerAvisosPendientes = (_req: Request, res: Response) => {
  res.json(service.pendientes());
};

export const marcarAvisoEnviado = (req: Request, res: Response) => {
  res.json(service.marcarEnviado(req.params.id as string));
};

export const descartarAviso = (req: Request, res: Response) => {
  res.json(service.descartar(req.params.id as string));
};