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

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida');

export const pedidoSchema = z.object({
  zonaId: z.string().min(1, 'La zona es obligatoria'),
  clienteNombre: z.string().trim().min(2, 'Nombre demasiado corto').max(100),
  clienteTelefono: telefono,
  direccion: z.string().trim().min(3, 'Dirección demasiado corta').max(200),
  fechaProgramada: z.preprocess(vacioAUndefined, fechaISO.optional()),
  franjaHoraria: z.preprocess(vacioAUndefined, z.enum(['MANANA', 'TARDE']).optional()),
  camioneroNombre: textoOpcional(100),
  observacionEntrega: textoOpcional(500),
});
// Los campos que no están acá (id, estado, novedad, etc.) se descartan automáticamente.

export const cambiarEstadoSchema = z
  .object({
    estado: z.enum(ESTADOS_PEDIDO),
    comentario: z.preprocess(
      vacioAUndefined,
      z.string().trim().min(3, 'Describí brevemente qué pasó').max(300, 'Máximo 300 caracteres').optional()
    ),
  })
  .superRefine((datos, ctx) => {
    if (!datos.comentario && datos.estado === 'CON_NOVEDAD') {
      ctx.addIssue({ code: 'custom', path: ['comentario'], message: 'Contanos qué pasó con la entrega' });
    }
    if (!datos.comentario && datos.estado === 'REPROGRAMADO') {
      ctx.addIssue({ code: 'custom', path: ['comentario'], message: 'Indicá el motivo de la reprogramación' });
    }
  });

export const filtroPedidosSchema = z
  .object({
    zonaId: z.string().optional(),
    estado: z.enum(ESTADOS_PEDIDO).optional(),
    desde: fechaISO.optional(),
    hasta: fechaISO.optional(),
    q: z.preprocess(vacioAUndefined, z.string().trim().max(100).optional()),
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, {
    message: 'La fecha "desde" no puede ser posterior a "hasta"',
    path: ['desde'],
  });

export type DatosPedido = z.infer<typeof pedidoSchema>;
export type DatosCambioEstado = z.infer<typeof cambiarEstadoSchema>;