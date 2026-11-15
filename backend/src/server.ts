import { criarApp } from './app';
import { runMigrations } from './db/client';

runMigrations();

const porta = Number(process.env.PORT ?? 3000);
criarApp().listen(porta, () => {
  console.log(`API Cão Saci em http://localhost:${porta}/api`);
});
