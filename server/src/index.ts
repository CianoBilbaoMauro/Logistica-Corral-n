import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import zonasRoutes from './routes/zonas.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import hojasRutaRoutes from './routes/hojas-ruta.routes.js';
import avisosRoutes from './routes/avisos.routes.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Servidor de Logística Corralón funcionando 🚀' });
});

app.use('/api/zonas', zonasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/hojas-de-ruta', hojasRutaRoutes);
app.use('/api/avisos', avisosRoutes);

// Ruta inexistente
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Siempre al final
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});