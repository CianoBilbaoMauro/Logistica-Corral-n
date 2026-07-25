import express from 'express';
import cors from 'cors';
import type { Zona, Pedido, HojaDeRuta } from './types/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- ZONAS DE REPARTO REALES ---
const zonasMock: Zona[] = [
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
    nombre: 'Marquesado / San Eduardo del Mar /  Chapadmalal',
    diasSugeridos: ['Martes', 'Jueves', 'Sábados'],
  },
  {
    id: 'z5',
    nombre: 'Mechongué / Otamendi',
    diasSugeridos: ['A coordinar'],
  },
];

// --- PEDIDOS DE PRUEBA ---  
let pedidosMock: Pedido[] = [
  {
    id: 'p1',
    clienteNombre: 'Gonzalo Pérez',
    clienteTelefono: '2291400001',
    direccion: 'Calle 21 N° 1420 (Centro)',
    zonaId: 'z1',
    estado: 'PENDIENTE',
  },
  {
    id: 'p2',
    clienteNombre: 'Estela Gómez',
    clienteTelefono: '2291400002',
    direccion: 'Calle 40 esquina 5 (Parquemar)',
    zonaId: 'z2',
    estado: 'PENDIENTE',
  },
  {
    id: 'p3',
    clienteNombre: 'Roberto Rossi',
    clienteTelefono: '2291400003',
    direccion: 'Av. 100 s/n (Mar del Sur)',
    zonaId: 'z3',
    estado: 'PENDIENTE',
  },
  {
    id: 'p4',
    clienteNombre: 'Campo El Trebol',
    clienteTelefono: '2291400004',
    direccion: 'Acceso Principal (Mechongué)',
    zonaId: 'z4',
    estado: 'PENDIENTE',
  },
  {
    id: 'p5',
    clienteNombre: 'Campo El Trebol',
    clienteTelefono: '2291400004',
    direccion: 'Acceso Principal (Mechongué)',
    zonaId: 'z5',
    estado: 'PENDIENTE',
  }
];

let hojasDeRutaMock: HojaDeRuta[] = [];

// --- RUTAS DE LA API ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de Logística Corralón funcionando 🚀' });
});

// Obtener todas las zonas
app.get('/api/zonas', (req, res) => {
  res.json(zonasMock);
});

// Obtener todos los pedidos (o filtrados por zona)
// Ejemplos: GET /api/pedidos  o  GET /api/pedidos?zonaId=z2
app.get('/api/pedidos', (req, res) => {
  const { zonaId, estado } = req.query;
  let resultado = pedidosMock;

  if (zonaId) {
    resultado = resultado.filter((p) => p.zonaId === zonaId);
  }

  if (estado) {
    resultado = resultado.filter((p) => p.estado === estado);
  }

  res.json(resultado);
});

// Crear un nuevo pedido
app.post('/api/pedidos', (req, res) => {
  const nuevoPedido: Pedido = {
    id: `p${Date.now()}`,
    estado: 'PENDIENTE',
    ...req.body,
  };
  pedidosMock.push(nuevoPedido);
  res.status(201).json(nuevoPedido);
});

// Actualizar estado de un pedido (ej: marcar como ENTREGADO, EN_CAMINO, etc.)
app.patch('/api/pedidos/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado, observacionEntrega, franjaHoraria, fechaProgramada } = req.body;

  const pedido = pedidosMock.find((p) => p.id === id);

  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  if (estado) pedido.estado = estado;
  if (observacionEntrega !== undefined) pedido.observacionEntrega = observacionEntrega;
  if (franjaHoraria) pedido.franjaHoraria = franjaHoraria;
  if (fechaProgramada) pedido.fechaProgramada = fechaProgramada;

  res.json(pedido);
});

// --- HOJAS DE RUTA ---

// Obtener todas las hojas de ruta
app.get('/api/hojas-de-ruta', (req, res) => {
  res.json(hojasDeRutaMock);
});

// Crear una hoja de ruta para un camionero
app.post('/api/hojas-de-ruta', (req, res) => {
  const { fecha, zonaId, camioneroNombre, pedidosIds } = req.body;

  const nuevaHoja: HojaDeRuta = {
    id: `hr${Date.now()}`,
    fecha,
    zonaId,
    camioneroNombre,
    pedidosIds,
  };

  hojasDeRutaMock.push(nuevaHoja);

  // Actualizamos el estado de los pedidos asignados a "EN_CAMINO"
  pedidosMock = pedidosMock.map((p) => {
    if (pedidosIds.includes(p.id)) {
      return { ...p, estado: 'EN_CAMINO' };
    }
    return p;
  });

  res.status(201).json(nuevaHoja);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});