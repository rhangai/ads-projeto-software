import cors from 'cors';
import express from 'express';
import { runMigrations } from './db/client';
import { tratarErros } from './http-error';
import { router } from './routes';

runMigrations();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' }));
app.use(express.json());

app.use('/api', router);
app.use('/api', (_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});
app.use(tratarErros);

const porta = Number(process.env.PORT ?? 3000);
app.listen(porta, () => {
  console.log(`API Cão Saci em http://localhost:${porta}/api`);
});
