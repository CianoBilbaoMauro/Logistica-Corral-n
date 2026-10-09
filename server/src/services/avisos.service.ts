import { randomUUID } from 'node:crypto';
import { AvisosRepository } from '../repositories/avisos.repository.js';
import { PedidosRepository } from '../repositories/pedidos.repository.js';
import { NotFoundError } from '../errors/app-error.js';
import { normalizarTelefonoAR } from '../utils/telefono.js';
import type { Aviso, AvisoPendiente } from '../models/aviso.model.js';
import type { Pedido, EstadoPedido } from '../models/pedido.model.js';

const repository = new AvisosRepository();
const pedidos = new PedidosRepository();

const FRANJAS = {
  MANANA: 'por la mañana (8:30 a 12:30)',
  TARDE: 'por la tarde (13:30 a 16:30)',
} as const;

function fechaAR(iso?: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : null;
}

function cuando(p: Pedido): string {
  const f = fechaAR(p.fechaProgramada);
  if (!f) return '';
  return p.franjaHoraria ? `${f}, ${FRANJAS[p.franjaHoraria]}` : f;
}

// Solo los estados que están acá generan aviso. Para agregar o quitar uno, editá esta lista.
const PLANTILLAS: Partial<Record<EstadoPedido, (p: Pedido) => string>> = {
  NOTIFICADO: (p) =>
    p.fechaProgramada
      ? `Te avisamos que tu entrega está programada para el ${cuando(p)}.`
      : 'Te avisamos que registramos tu pedido. En breve coordinamos la entrega.',
  EN_CAMINO: () => 'Tu pedido salió y está *en camino* 🚚.',
  LLEGA_PRONTO: () => 'Tu pedido *llega pronto* ⏱️. Por favor, tené a alguien para recibirlo.',
  ENTREGADO: () => 'Tu pedido fue *entregado* ✅. ¡Gracias por elegirnos!',
  REPROGRAMADO: () => 'Tu entrega fue *reprogramada*. Te vamos a contactar para coordinar la nueva fecha.',
  CON_NOVEDAD: () => 'Tuvimos una *novedad* con tu entrega. Nos comunicamos con vos para resolverlo.',
};

export class AvisosService {
  // Se llama cada vez que cambia el estado de un pedido
  generarPara(pedido: Pedido): Aviso | null {
    // Cualquier aviso viejo sin enviar queda desactualizado
    repository.descartarPendientesDePedido(pedido.id);

    const plantilla = PLANTILLAS[pedido.estado];
    if (!plantilla) return null;

    const mensaje =
      `🏗️ *Gabarain Materiales*\n` +
      `Hola *${pedido.clienteNombre}*. ${plantilla(pedido)}\n` +
      `📍 ${pedido.direccion}`;

    return repository.crear({
      id: randomUUID(),
      pedidoId: pedido.id,
      estado: pedido.estado,
      mensaje,
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