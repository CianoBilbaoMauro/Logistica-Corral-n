import { z } from 'zod';
import { ESTADOS_PEDIDO } from '../models/pedido.model.js';

// El front manda '' en los campos opcionales vacíos: lo tratamos como "sin valor"
const vacioAUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const textoOpcional = (max: number) =>
  z.preprocess(vacioAUndefined, z.string().trim().max(max).optional());

const telefono = z
  .string()
  .transform((s) => s.replace(/\D/g, ''))
  .pipe(z.string().min(8, 'Teléfono inválido').max(15, 'Teléfono inválido'));

export const pedidoSchema = z.object({
  zonaId: z.string().min(1, 'La zona es obligatoria'),
  clienteNombre: z.string().trim().min(2, 'Nombre demasiado corto').max(100),
  clienteTelefono: telefono,
  direccion: z.string().trim().min(3, 'Dirección demasiado corta').max(200),
  fechaProgramada: z.preprocess(
    vacioAUndefined,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional()
  ),
  franjaHoraria: z.preprocess(vacioAUndefined, z.enum(['MANANA', 'TARDE']).optional()),
  camioneroNombre: textoOpcional(100),
  observacionEntrega: textoOpcional(500),
});
// Los campos que no están acá (id, estado, etc.) se descartan automáticamente.

export const cambiarEstadoSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO),
});

export const filtroPedidosSchema = z.object({
  zonaId: z.string().optional(),
  estado: z.enum(ESTADOS_PEDIDO).optional(),
});

export type DatosPedido = z.infer<typeof pedidoSchema>;