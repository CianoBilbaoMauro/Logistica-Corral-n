import type { HojaDeRuta } from '../models/hoja-ruta.model.js';

export let hojasDeRutaMock: HojaDeRuta[] = [
  {
    id: 'hr1',
    fecha: '2026-07-27',
    zonaId: 'z1',
    camioneroNombre: 'Carlos López',
    pedidosIds: ['p1'],
    estado: 'EN_PROCESO',
    observaciones: 'Reparto turno mañana',
  },
];

export const setHojasDeRutaMock = (hojas: HojaDeRuta[]) => {
  hojasDeRutaMock = hojas;
};