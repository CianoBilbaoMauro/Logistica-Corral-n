import type { Aviso } from '../models/aviso.model.js';

const avisos: Aviso[] = [];

export class AvisosRepository {
  pendientes(): Aviso[] {
    return avisos.filter((a) => a.estadoAviso === 'PENDIENTE');
  }

  buscarPorId(id: string): Aviso | undefined {
    return avisos.find((a) => a.id === id);
  }

  crear(aviso: Aviso): Aviso {
    avisos.push(aviso);
    return aviso;
  }

  resolver(id: string, estadoAviso: 'ENVIADO' | 'DESCARTADO'): Aviso | undefined {
    const aviso = this.buscarPorId(id);
    if (aviso && aviso.estadoAviso === 'PENDIENTE') {
      aviso.estadoAviso = estadoAviso;
      aviso.resueltoEn = new Date().toISOString();
    }
    return aviso;
  }

  descartarPendientesDePedido(pedidoId: string): void {
    for (const a of avisos) {
      if (a.pedidoId === pedidoId && a.estadoAviso === 'PENDIENTE') {
        this.resolver(a.id, 'DESCARTADO');
      }
    }
  }
}