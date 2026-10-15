import { HttpErrorResponse } from '@angular/common/http';
import { mensajeError } from './errores';

describe('mensajeError', () => {
  it('avisa cuando no hay conexión con el servidor', () => {
    const err = new HttpErrorResponse({ status: 0 });
    expect(mensajeError(err, 'x')).toBe('No se pudo conectar con el servidor.');
  });

  it('junta los mensajes de validación', () => {
    const err = new HttpErrorResponse({ status: 400, error: { detalles: [{ mensaje: 'A' }, { mensaje: 'B' }] } });
    expect(mensajeError(err, 'x')).toBe('A · B');
  });

  it('usa el mensaje que manda el servidor', () => {
    const err = new HttpErrorResponse({ status: 404, error: { error: 'No existe' } });
    expect(mensajeError(err, 'x')).toBe('No existe');
  });

  it('usa el texto por defecto con errores desconocidos', () => {
    expect(mensajeError(new Error('boom'), 'por defecto')).toBe('por defecto');
  });
});