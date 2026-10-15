import { normalizarDireccion } from './mapas';

describe('normalizarDireccion', () => {
  it('convierte "41 nro 1853" en "Calle 41 1853"', () => {
    expect(normalizarDireccion('41 nro 1853')).toBe('Calle 41 1853');
    expect(normalizarDireccion('41 N° 1853')).toBe('Calle 41 1853');
  });

  it('deja como están las direcciones ya claras', () => {
    expect(normalizarDireccion('Calle 40 esquina 5')).toBe('Calle 40 esquina 5');
    expect(normalizarDireccion('Avenida 9 2107')).toBe('Avenida 9 2107');
  });

  it('expande "Av." a "Avenida"', () => {
    expect(normalizarDireccion('Av. 9 Nro. 2107')).toBe('Avenida 9 2107');
  });
});