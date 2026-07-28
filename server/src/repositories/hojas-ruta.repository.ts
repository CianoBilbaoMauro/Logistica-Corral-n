import { hojasDeRutaMock, setHojasDeRutaMock } from '../data/hojas-ruta.mock.js';
import type { HojaDeRuta, EstadoHojaDeRuta } from '../models/hoja-ruta.model.js';

export class HojasRutaRepository {
  obtenerTodas(fecha?: string, zonaId?: string, estado?: EstadoHojaDeRuta): HojaDeRuta[] {
    let resultado = hojasDeRutaMock;

    if (fecha) {
      resultado = resultado.filter((h) => h.fecha === fecha);
    }
    if (zonaId) {
      resultado = resultado.filter((h) => h.zonaId === zonaId);
    }
    if (estado) {
      resultado = resultado.filter((h) => h.estado === estado);
    }

    return resultado;
  }

  buscarPorId(id: string): HojaDeRuta | undefined {
    return hojasDeRutaMock.find((h) => h.id === id);
  }

  crear(hoja: HojaDeRuta): HojaDeRuta {
    hojasDeRutaMock.push(hoja);
    return hoja;
  }

  actualizar(hojaActualizada: HojaDeRuta): HojaDeRuta {
    const nuevasHojas = hojasDeRutaMock.map((h) =>
      h.id === hojaActualizada.id ? hojaActualizada : h
    );
    setHojasDeRutaMock(nuevasHojas);
    return hojaActualizada;
  }
}