import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { tratarErros } from './http-error';
import { router } from './routes';

/**
 * Monta o app Express sem abrir porta. O server.ts chama listen();
 * os testes de integração usam o app direto com o Supertest.
 */
export function criarApp(): Express {
  const app = express();
  // Cabeçalhos de segurança (nosniff, frame-ancestors, etc.) e remove o X-Powered-By.
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' }));
  // Os maiores corpos da API (cadastro de cão) têm poucas centenas de bytes.
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', router);
  app.use('/api', (_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  });
  app.use(tratarErros);
  return app;
}
