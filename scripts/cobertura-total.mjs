// Junta a cobertura da API (Vitest) e do front (Karma) num total só.
// Rode depois de `pnpm test:coverage`, que gera os dois coverage-summary.json.
//
// COBERTURA_MINIMA=90  -> sai com erro se a cobertura de instruções do projeto ficar abaixo.
// GITHUB_STEP_SUMMARY  -> no GitHub Actions, também escreve a tabela no resumo da execução.
import { appendFileSync, readFileSync } from 'node:fs';

const pacotes = {
  API: 'backend/coverage/coverage-summary.json',
  Front: 'frontend/coverage/coverage-summary.json',
};
const metricas = ['lines', 'statements', 'functions', 'branches'];
const nomes = { lines: 'Linhas', statements: 'Instruções', functions: 'Funções', branches: 'Ramos' };

const pct = (c, t) => (t === 0 ? 100 : (100 * c) / t);
const fmt = (n) => n.toFixed(2).replace('.', ',') + '%';

const colunas = {};
const soma = Object.fromEntries(metricas.map((m) => [m, { covered: 0, total: 0 }]));
for (const [nome, arquivo] of Object.entries(pacotes)) {
  const total = JSON.parse(readFileSync(arquivo, 'utf8')).total;
  colunas[nome] = total;
  for (const m of metricas) {
    soma[m].covered += total[m].covered;
    soma[m].total += total[m].total;
  }
}
colunas['Projeto'] = soma;

// Saída no terminal
console.log('\nCobertura de testes\n');
console.log(`  ${''.padEnd(11)}${Object.keys(colunas).map((c) => c.padStart(10)).join('')}`);
for (const m of metricas) {
  const valores = Object.values(colunas).map((t) => fmt(pct(t[m].covered, t[m].total)).padStart(10));
  console.log(`  ${nomes[m].padEnd(11)}${valores.join('')}`);
}
const instrucoes = pct(soma.statements.covered, soma.statements.total);
console.log(`\n  Projeto (instruções, inteiro): ${Math.floor(instrucoes)}%\n`);

// Resumo no GitHub Actions
if (process.env.GITHUB_STEP_SUMMARY) {
  const cab = `| Métrica | ${Object.keys(colunas).join(' | ')} |\n|---|${Object.keys(colunas).map(() => '---:').join('|')}|\n`;
  const linhas = metricas
    .map((m) => `| ${nomes[m]} | ${Object.values(colunas).map((t) => `${fmt(pct(t[m].covered, t[m].total))} (${t[m].covered}/${t[m].total})`).join(' | ')} |`)
    .join('\n');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Cobertura de testes\n\n${cab}${linhas}\n\n**Projeto (instruções): ${Math.floor(instrucoes)}%**\n`);
}

// Mínimo exigido
const minimo = Number(process.env.COBERTURA_MINIMA ?? 0);
if (instrucoes < minimo) {
  console.error(`Cobertura de instruções ${fmt(instrucoes)} abaixo do mínimo de ${minimo}%.`);
  process.exit(1);
}
