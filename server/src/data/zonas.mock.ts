import type { Zona } from '../models/zona.model.js';

export const zonasMock: Zona[] = [
  {
    id: 'z1',
    nombre: 'Miramar Centro',
    diasSugeridos: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  },
  {
    id: 'z2',
    nombre: 'Parque Bristol / Copacabana / Parquemar / Las Lomas',
    diasSugeridos: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  },
  {
    id: 'z3',
    nombre: 'Mar del Sur',
    diasSugeridos: ['Lunes', 'Miércoles', 'Viernes'],
  },
  {
    id: 'z4',
    nombre: 'Marquesado / San Eduardo del Mar / Chapadmalal',
    diasSugeridos: ['Martes', 'Jueves', 'Sábados'],
  },
  {
    id: 'z5',
    nombre: 'Mechongué / Otamendi',
    diasSugeridos: ['A coordinar'],
  }
];