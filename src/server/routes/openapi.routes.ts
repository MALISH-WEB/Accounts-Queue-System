import { Router } from 'express';

const router = Router();

const openApiSchema = {
  openapi: '3.0.3',
  info: {
    title: 'CampusQ — UCU Accounts Office Digital Services & Intelligent Virtual Queue API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API for Uganda Christian University (UCU) Accounts Office. Features automated verified-only payment calculation, milestone checks, 45% registration eligibility, physical visit avoidance metrics, and virtual queue management.',
    contact: {
      name: 'UCU Directorate of Finance and Accounts',
      email: 'accounts@ucu.ac.ug',
      url: 'https://ucu.ac.ug/finance',
    },
  },
  servers: [{ url: '/api', description: 'CampusQ Core Gateway' }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate student or accounts officer',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'd.mukasa@student.ucu.ac.ug' },
                  password: { type: 'string', example: 'Student123!' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'JWT authentication token and user profile returned' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/registration-eligibility/check': {
      get: {
        summary: 'Registration Financial Eligibility Check',
        description: 'Calculates verified payment percentage vs statutory 45% threshold and checks financial holds.',
        parameters: [
          { name: 'studentId', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'semesterId', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Returns formal eligibility determination, balance, deficit amount, and explanation.' },
        },
      },
    },
    '/payments': {
      get: { summary: 'List payments with role isolation and filters' },
      post: { summary: 'Submit proof of payment with unique transaction reference' },
    },
    '/payments/verification/{id}/verify': {
      post: { summary: 'Verify payment, recalculate account, generate official receipt, and notify student' },
    },
    '/payments/verification/{id}/reject': {
      post: { summary: 'Reject payment submission with formal audit reason' },
    },
    '/tickets': {
      get: { summary: 'List tickets with intelligent routing info' },
      post: { summary: 'Create service ticket for Accounts Office' },
    },
    '/queues/join': {
      post: { summary: 'Join virtual queue for physical counter attendance' },
    },
    '/queues/live': {
      get: { summary: 'Live queue counter and waiting numbers for public display' },
    },
    '/reports/summary': {
      get: { summary: 'Accounts Office financial, service, and physical visit avoidance KPI summary' },
    },
  },
};

router.get('/openapi.json', (_req, res) => {
  res.json(openApiSchema);
});

export default router;
