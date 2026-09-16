import { Router } from 'express';
import { db } from '../../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, queueOnly, selfServiceOnly } = req.query;
    let sql = `
      SELECT srv.*, sc.name as category_name, sc.description as category_description 
      FROM services srv
      JOIN service_categories sc ON srv.category_id = sc.id
      WHERE srv.is_active = 1
    `;
    const params: any[] = [];

    if (category) {
      sql += ` AND srv.category_id = ?`;
      params.push(category);
    }
    if (queueOnly === 'true') {
      sql += ` AND srv.is_queue_required = 1`;
    }
    if (selfServiceOnly === 'true') {
      sql += ` AND srv.is_self_service_supported = 1`;
    }

    sql += ` ORDER BY srv.name ASC`;
    const services = await db.query<any>(sql, params);
    res.json(services);
  } catch (err: any) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const categories = await db.query<any>(`SELECT * FROM service_categories ORDER BY name ASC`);
    res.json(categories);
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve service categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const service = await db.getOne<any>(
      `SELECT srv.*, sc.name as category_name 
       FROM services srv
       JOIN service_categories sc ON srv.category_id = sc.id
       WHERE srv.id = ?`,
      [req.params.id]
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve service' });
  }
});

export default router;
