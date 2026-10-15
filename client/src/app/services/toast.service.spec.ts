import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('agrega y cierra avisos', () => {
    const toast = new ToastService();
    toast.exito('Listo');
    expect(toast.lista().length).toBe(1);
    expect(toast.lista()[0].tipo).toBe('exito');

    toast.cerrar(toast.lista()[0].id);
    expect(toast.lista().length).toBe(0);
  });

  it('muestra como máximo 4 avisos a la vez', () => {
    const toast = new ToastService();
    for (let i = 0; i < 6; i++) toast.info(`Aviso ${i}`);
    expect(toast.lista().length).toBe(4);
    expect(toast.lista()[3].mensaje).toBe('Aviso 5');
  });
});