import express from 'express';
import cors from 'cors';

// Importamos los enrutadores modularizados
import zonasRoutes from './routes/zonas.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import hojasRutaRoutes from './routes/hojas-ruta.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Servidor de Logística Corralón funcionando 🚀' });
});

// Registrar Endpoints
app.use('/api/zonas', zonasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/hojas-de-ruta', hojasRutaRoutes);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});   