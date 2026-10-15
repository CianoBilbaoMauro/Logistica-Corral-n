import { z } from 'zod';
import {
  CONDICIONES_PAGO, EMISORES, ESTADOS_PEDIDO, TIPOS_COMPROBANTE,
} from '../models/pedido.model.js';

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

// Solo se aceptan coordenadas o enlaces https de Google Maps (evita guardar enlaces a sitios ajenos)
const COORDENADAS = /^-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$/;

function esUbicacionValida(valor: string): boolean {
  if (COORDENADAS.test(valor)) return true;
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'maps.app.goo.gl' || host === 'maps.google.com') return true;
    if (host === 'goo.gl') return url.pathname.startsWith('/maps');
    return /^(www\.)?google\.com(\.ar)?$/.test(host) && url.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}

const ubicacion = z
  .string()
  .trim()
  .max(300)
  .refine(esUbicacionValida, 'Ubicación inválida: pegá un enlace de Google Maps o coordenadas');

// Número de factura: letras, números, guiones y barras (ej: 0001-00001234)
const nroFactura = z
  .string()
  .trim()
  .max(30, 'El número de factura es demasiado largo')
  .regex(/^[A-Za-z0-9\-/ ]+$/, 'El número de factura solo puede tener letras, números y guiones');

export const pedidoSchema = z.object({
  zonaId: z.string().min(1, 'La zona es obligatoria'),
  clienteNombre: z.string().trim().min(2, 'Nombre demasiado corto').max(100),
  clienteTelefono: telefono,
  direccion: z.string().trim().min(3, 'Dirección demasiado corta').max(200),
  ubicacionUrl: z.preprocess(vacioAUndefined, ubicacion.optional()),
  fechaProgramada: z.preprocess(vacioAUndefined, fechaISO.optional()),
  franjaHoraria: z.preprocess(vacioAUndefined, z.enum(['MANANA', 'TARDE']).optional()),
  tipoComprobante: z.preprocess(vacioAUndefined, z.enum(TIPOS_COMPROBANTE).optional()),
  condicionPago: z.preprocess(vacioAUndefined, z.enum(CONDICIONES_PAGO).optional()),
  emisor: z.preprocess(vacioAUndefined, z.enum(EMISORES).optional()),
  nroFactura: z.preprocess(vacioAUndefined, nroFactura.optional()),
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