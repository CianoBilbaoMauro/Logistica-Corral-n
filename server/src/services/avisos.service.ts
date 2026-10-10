import { randomUUID } from 'node:crypto';
import { AvisosRepository } from '../repositories/avisos.repository.js';
import { PedidosRepository } from '../repositories/pedidos.repository.js';
import { NotFoundError } from '../errors/app-error.js';
import { normalizarTelefonoAR } from '../utils/telefono.js';
import type { Aviso, AvisoPendiente } from '../models/aviso.model.js';
import type { Pedido, EstadoPedido } from '../models/pedido.model.js';

const repository = new AvisosRepository();
const pedidos = new PedidosRepository();

const HORARIOS = {
  MANANA: 'Por la mañana, de 8:30 a 12:30 hs',
  TARDE: 'Por la tarde, de 13:30 a 16:30 hs',
} as const;

function fechaAR(iso?: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : null;
}

// Saca puntos y espacios del final para no duplicar la puntuación del mensaje
const limpiar = (texto: string) => texto.trim().replace(/[.\s]+$/, '');

// Bloque con los datos de la entrega (solo muestra lo que está cargado)
function detalle(p: Pedido): string {
  const lineas = [`📍 *Dirección:* ${p.direccion}`];
  const fecha = fechaAR(p.fechaProgramada);
  if (fecha) lineas.push(`📅 *Fecha:* ${fecha}`);
  if (p.franjaHoraria) lineas.push(`🕒 *Horario:* ${HORARIOS[p.franjaHoraria]}`);
  return lineas.join('\n');
}

// Cuerpo de cada mensaje. Solo los estados que están acá generan aviso: para agregar o quitar uno, editá esta lista.
const PLANTILLAS: Partial<Record<EstadoPedido, (p: Pedido) => string>> = {
  NOTIFICADO: () =>
    'Te confirmamos que tu pedido fue registrado y tiene entrega programada. ' +
    'Los datos de la entrega son los siguientes:',

  EN_PREPARACION: () =>
    'Estamos *preparando tu pedido* 📦. ' +
    'Cuando salga a reparto te avisamos nuevamente. Los datos de la entrega son:',

  EN_CAMINO: () =>
    'Tu pedido ya salió y está *en camino* 🚚. ' +
    'Por favor, asegurate de que haya alguien para recibirlo. Los datos de la entrega son:',

  ENTREGADO: () =>
    'Tu pedido fue *entregado* ✅. Esperamos que esté todo en orden. Datos de la entrega:',

  REPROGRAMADO: (p) =>
    (p.novedad
      ? `Tuvimos que *reprogramar* tu entrega. Motivo: ${limpiar(p.novedad)}. `
      : 'Tuvimos que *reprogramar* tu entrega. ') +
    'Nos vamos a comunicar con vos para coordinar una nueva fecha. Disculpá las molestias. Datos de la entrega:',

  CON_NOVEDAD: (p) =>
    (p.novedad
      ? `Tuvimos una *novedad* con tu entrega: ${limpiar(p.novedad)}. `
      : 'Tuvimos una *novedad* con tu entrega. ') +
    'Nos vamos a comunicar con vos para resolverlo a la brevedad. Datos de la entrega:',
};

function armarMensaje(p: Pedido, cuerpo: string): string {
  return [
    '🏗️ *Gabarain Materiales*',
    '',
    `Hola *${p.clienteNombre}*, te escribimos por tu pedido.`,
    '',
    cuerpo,
    '',
    detalle(p),
    '',
    'Ante cualquier consulta, respondé este mensaje y te ayudamos. ¡Gracias por elegirnos!',
  ].join('\n');
}

export class AvisosService {
  // Se llama cada vez que cambia el estado de un pedido
  generarPara(pedido: Pedido): Aviso | null {
    // Cualquier aviso viejo sin enviar queda desactualizado
    repository.descartarPendientesDePedido(pedido.id);

    const plantilla = PLANTILLAS[pedido.estado];
    if (!plantilla) return null;

    return repository.crear({
      id: randomUUID(),
      pedidoId: pedido.id,
      estado: pedido.estado,
      mensaje: armarMensaje(pedido, plantilla(pedido)),
      estadoAviso: 'PENDIENTE',
      creadoEn: new Date().toISOString(),
    });
  }

  pendientes(): AvisoPendiente[] {
    const salida: AvisoPendiente[] = [];
    for (const aviso of repository.pendientes()) {
      const pedido = pedidos.buscarPorId(aviso.pedidoId);
      if (!pedido) {
        repository.resolver(aviso.id, 'DESCARTADO'); // el pedido se eliminó
        continue;
      }
      salida.push({
        ...aviso,
        clienteNombre: pedido.clienteNombre,
        telefono: normalizarTelefonoAR(pedido.clienteTelefono),
      });
    }
    return salida;
  }

  marcarEnviado(id: string): Aviso {
    if (!repository.buscarPorId(id)) throw new NotFoundError('Aviso no encontrado');
    return repository.resolver(id, 'ENVIADO') as Aviso;
  }

  descartar(id: string): Aviso {
    if (!repository.buscarPorId(id)) throw new NotFoundError('Aviso no encontrado');
    return repository.resolver(id, 'DESCARTADO') as Aviso;
  }

  descartarDePedido(pedidoId: string): void {
    repository.descartarPendientesDePedido(pedidoId);
  }
}