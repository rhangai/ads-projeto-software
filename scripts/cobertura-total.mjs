// Junta a cobertura da API (Vitest) e do front (Karma) num total só.
// Rode depois de `pnpm test:coverage`, que gera os dois coverage-summary.json.
import { readFileSync } from 'node:fs';

const pacotes = {
  'API (backend)': 'backend/coverage/coverage-summary.json',
  'Front (frontend)': 'frontend/coverage/coverage-summary.json',
};
const metricas = ['lines', 'statements', 'functions', 'branches'];
const nomes = { lines: 'Linhas', statements: 'Instruções', functions: 'Funções', branches: 'Ramos' };

const soma = Object.fromEntries(metricas.map((m) => [m, { covered: 0, total: 0 }]));
const pct = (c, t) => (t === 0 ? 100 : (100 * c) / t);
const fmt = (n) => n.toFixed(2).replace('.', ',') + '%';

console.log('\nCobertura de testes\n');
for (const [nome, arquivo] of Object.entries(pacotes)) {
  const total = JSON.parse(readFileSync(arquivo, 'utf8')).total;
  console.log(`${nome}:`);
  for (const m of metricas) {
    soma[m].covered += total[m].covered;
    soma[m].total += total[m].total;
    console.log(`  ${nomes[m].padEnd(11)} ${fmt(pct(total[m].covered, total[m].total)).padStart(8)}  (${total[m].covered}/${total[m].total})`);
  }
}
console.log('Projeto inteiro:');
for (const m of metricas) {
  console.log(`  ${nomes[m].padEnd(11)} ${fmt(pct(soma[m].covered, soma[m].total)).padStart(8)}  (${soma[m].covered}/${soma[m].total})`);
}
console.log();
