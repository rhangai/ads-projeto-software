// Apaga o banco local. Depois disso, rode db:migrate e db:seed (ou db:setup).
import { rmSync } from 'node:fs';
import { dbFile } from './config';

for (const sufixo of ['', '-wal', '-shm']) {
  rmSync(dbFile + sufixo, { force: true });
}
console.log(`Banco ${dbFile} apagado.`);
