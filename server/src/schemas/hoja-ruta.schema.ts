import { z } from 'zod';
import { ESTADOS_HOJA } from '../models/hoja-ruta.model.js';

const vacioAUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const textoOpcional = (max: number) =>
  z.preprocess(vacioAUndefined, z.string().trim().max(max).optional());

const base = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  zonaId: z.string().min(1, 'La zona es obligatoria'),
  camioneroNombre: textoOpcional(100),
  observaciones: textoOpcional(500),
  pedidosIds: z.array(z.string().min(1)).max(200),
});

// Al crear, pedidosIds puede faltar (arranca vacío). El estado lo pone el servidor.
export const crearHojaSchema = base.extend({
  pedidosIds: z.array(z.string().min(1)).max(200).default([]),
});

// Al actualizar, todo es opcional
export const actualizarHojaSchema = base
  .partial()
  .extend({ estado: z.enum(ESTADOS_HOJA).optional() });

export const filtroHojasSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  zonaId: z.string().optional(),
  estado: z.enum(ESTADOS_HOJA).optional(),
});

export type DatosHojaNueva = z.infer<typeof crearHojaSchema>;
export type DatosHojaEdicion = z.infer<typeof actualizarHojaSchema>;