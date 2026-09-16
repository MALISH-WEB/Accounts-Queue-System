import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/database.js';

import authRoutes from './src/server/routes/auth.routes.js';
import studentsRoutes from './src/server/routes/students.routes.js';
import servicesRoutes from './src/server/routes/services.routes.js';
import paymentsRoutes from './src/server/routes/payments.routes.js';
import financialRoutes from './src/server/routes/financial.routes.js';
import ticketsRoutes from './src/server/routes/tickets.routes.js';
import queuesRoutes from './src/server/routes/queues.routes.js';
import appointmentsRoutes from './src/server/routes/appointments.routes.js';
import receiptsRoutes from './src/server/routes/receipts.routes.js';
import reportsRoutes from './src/server/routes/reports.routes.js';
import systemRoutes from './src/server/routes/system.routes.js';
import openapiRoutes from './src/server/routes/openapi.routes.js';
import registrationsRoutes from './src/server/routes/registrations.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize Relational Database
  try {
    await db.query('SELECT 1');
    console.log('✅ CampusQ: Relational database connected and operational.');
  } catch (dbErr) {
    console.error('❌ CampusQ Database initialization warning:', dbErr);
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'CampusQ — UCU Accounts Office Digital Services',
      institution: 'Uganda Christian University (UCU)',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/financial', financialRoutes);
  app.use('/api/tickets', ticketsRoutes);
  app.use('/api/queues', queuesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/receipts', receiptsRoutes);
  app.use('/api/registrations', registrationsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/docs', openapiRoutes);

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CampusQ UCU Accounts Office Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CampusQ server:', err);
  process.exit(1);
});
