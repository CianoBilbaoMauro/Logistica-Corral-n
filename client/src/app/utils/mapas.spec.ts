import { esUbicacionValida, urlDestino } from './mapas';

describe('esUbicacionValida', () => {
  it('acepta coordenadas', () => {
    expect(esUbicacionValida('-38.2699, -57.8358')).toBe(true);
  });

  it('acepta enlaces de Google Maps', () => {
    expect(esUbicacionValida('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(esUbicacionValida('https://www.google.com/maps/place/Miramar')).toBe(true);
    expect(esUbicacionValida('https://maps.google.com/?q=-38.27,-57.83')).toBe(true);
  });

  it('rechaza sitios ajenos y enlaces sin https', () => {
    expect(esUbicacionValida('https://sitio-falso.com/maps')).toBe(false);
    expect(esUbicacionValida('http://maps.google.com/?q=1,2')).toBe(false);
    expect(esUbicacionValida('javascript:alert(1)')).toBe(false);
    expect(esUbicacionValida('hola')).toBe(false);
  });
});

describe('urlDestino', () => {
  it('usa la ubicación exacta cuando es un enlace', () => {
    const url = 'https://maps.app.goo.gl/abc123';
    expect(urlDestino({ direccion: 'Calle 1', zonaId: 'z1', ubicacionUrl: url })).toBe(url);
  });

  it('arma la ruta con coordenadas', () => {
    const url = urlDestino({ direccion: 'Calle 1', zonaId: 'z1', ubicacionUrl: '-38.27, -57.84' });
    expect(url).toContain('destination=-38.27%2C-57.84');
  });

  it('sin ubicación busca la dirección con la localidad de la zona', () => {
    const url = urlDestino({ direccion: 'Calle 12 100', zonaId: 'z3' });
    expect(url).toContain(encodeURIComponent('Calle 12 100, Mar del Sur, Buenos Aires, Argentina'));
  });
});