import type { Request, Response } from 'express';
import { HojasRutaService } from '../services/hojas-ruta.service.js';
import type { EstadoHojaDeRuta } from '../models/hoja-ruta.model.js';

const service = new HojasRutaService();

export const obtenerHojas = (req: Request, res: Response) => {
  const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined;
  const zonaId = typeof req.query.zonaId === 'string' ? req.query.zonaId : undefined;
  const estado = typeof req.query.estado === 'string' ? (req.query.estado as EstadoHojaDeRuta) : undefined;

  const hojas = service.obtenerHojas(fecha, zonaId, estado);
  res.json(hojas);
};

export const obtenerHojaPorId = (req: Request, res: Response) => {
  const id = req.params.id as string;
  const hoja = service.obtenerPorId(id);

  if (!hoja) {
    res.status(404).json({ error: 'Hoja de ruta no encontrada' });
    return;
  }

  res.json(hoja);
};

export const crearHoja = (req: Request, res: Response) => {
  const hoja = service.crearHoja(req.body);
  res.status(201).json(hoja);
};

export const actualizarHoja = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const hoja = service.actualizarHoja(id, req.body);
    res.json(hoja);
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : 'Hoja de ruta no encontrada',
    });
  }
};