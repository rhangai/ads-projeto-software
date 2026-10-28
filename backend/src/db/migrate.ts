// Cria o banco (se não existir) e aplica as migrations pendentes.
import { runMigrations } from './client';

runMigrations();
console.log('Migrations aplicadas.');
