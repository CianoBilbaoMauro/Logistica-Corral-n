import type { CondicionPago, Emisor, Pedido, TipoComprobante } from './logistica.model';

export const TIPOS_COMPROBANTE: { clave: TipoComprobante; label: string }[] = [
  { clave: 'FACTURA_A', label: 'Factura A' },
  { clave: 'FACTURA_B', label: 'Factura B' },
  { clave: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
];

export const CONDICIONES_PAGO: { clave: CondicionPago; label: string }[] = [
  { clave: 'CONTADO', label: 'Contado' },
  { clave: 'CTA_CTE', label: 'Cta. Cte.' },
];

export const EMISORES: { clave: Emisor; label: string }[] = [
  { clave: 'GABARAIN', label: 'Gabarain' },
  { clave: 'MATERIALES', label: 'Materiales' },
];

const etiqueta = <T extends string>(lista: { clave: T; label: string }[], valor?: T): string =>
  lista.find((x) => x.clave === valor)?.label ?? '';

export const etiquetaTipo = (v?: TipoComprobante) => etiqueta(TIPOS_COMPROBANTE, v);
export const etiquetaCondicion = (v?: CondicionPago) => etiqueta(CONDICIONES_PAGO, v);
export const etiquetaEmisor = (v?: Emisor) => etiqueta(EMISORES, v);

// Ej: "Factura A · Cta. Cte. · Gabarain · N° 0001-00001234" (solo lo que esté cargado)
export function etiquetaComprobante(
  p: Pick<Pedido, 'tipoComprobante' | 'condicionPago' | 'emisor' | 'nroFactura'>,
): string {
  return [
    etiquetaTipo(p.tipoComprobante),
    etiquetaCondicion(p.condicionPago),
    etiquetaEmisor(p.emisor),
    p.nroFactura ? `N° ${p.nroFactura}` : '',
  ].filter(Boolean).join(' · ');
}