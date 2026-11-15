import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { runMigrations } from './db/client';
import { tratarErros } from './http-error';
import { router } from './routes';

runMigrations();

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

const porta = Number(process.env.PORT ?? 3000);
app.listen(porta, () => {
  console.log(`API Cão Saci em http://localhost:${porta}/api`);
});
