import { ESTADO_MAP, FRANJAS } from '../models/estados';
import { etiquetaCondicion, etiquetaEmisor, etiquetaTipo } from '../models/facturacion';
import type { Pedido, Zona } from '../models/logistica.model';
import { fechaLocal } from './fechas';

const SEPARADOR = ';'; // Excel en español separa con punto y coma

// Entre comillas, y con apóstrofe adelante si empieza como una fórmula (evita que Excel la ejecute)
function celda(valor: unknown): string {
  let texto = valor == null ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

function fecha(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function fechaHora(iso?: string): string {
  if (!iso) return '';
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return '';
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

// Descarga un .csv que se abre directo en Excel
export function exportarPedidosCsv(pedidos: Pedido[], zonas: Zona[]): void {
  const nombres = new Map<string, string>(zonas.map((z) => [String(z.id), z.nombre] as [string, string]));

  const encabezado = [
    'Cliente', 'Teléfono', 'Dirección', 'Zona', 'Fecha de entrega', 'Horario',
    'Comprobante', 'Condición de pago', 'Facturado por', 'N° de factura',
    'Estado', 'Último cambio', 'Camionero', 'Observaciones', 'Novedad',
  ];

  const filas = pedidos.map((p) => [
    p.clienteNombre,
    p.clienteTelefono,
    p.direccion,
    nombres.get(String(p.zonaId)) ?? '',
    fecha(p.fechaProgramada),
    p.franjaHoraria ? FRANJAS[p.franjaHoraria] : '',
    etiquetaTipo(p.tipoComprobante),
    etiquetaCondicion(p.condicionPago),
    etiquetaEmisor(p.emisor),
    p.nroFactura ?? '',
    ESTADO_MAP[p.estado]?.label ?? p.estado,
    fechaHora(p.estadoActualizadoEn),
    p.camioneroNombre ?? '',
    p.observacionEntrega ?? '',
    p.novedad ?? '',
  ]);

  const contenido = [encabezado, ...filas]
    .map((fila) => fila.map(celda).join(SEPARADOR))
    .join('\r\n');

  // \uFEFF: para que Excel respete las tildes
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `pedidos_${fechaLocal()}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}