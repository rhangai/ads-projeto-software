// Verifica se a demo publicada está no ar e inteira. Usado pelo workflow de monitoramento.
//
//   node scripts/verificar-site.mjs [url]
//
// Sai com código 1 (DOWN) se alguma verificação falhar. No GitHub Actions também escreve
// a tabela de resultados no resumo da execução (GITHUB_STEP_SUMMARY).
import { appendFileSync } from 'node:fs';

const BASE = (process.argv[2] ?? process.env.SITE_URL ?? 'https://rhangai.github.io/ads-projeto-software/').replace(/\/?$/, '/');
const LIMITE_MS = Number(process.env.LIMITE_MS ?? 10_000);

const resultados = [];

async function verificar(nome, url, { status = [200], contem = [] } = {}) {
  const inicio = performance.now();
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(LIMITE_MS), headers: { 'cache-control': 'no-cache' } });
    const corpo = contem.length ? await res.text() : (await res.arrayBuffer(), '');
    const ms = Math.round(performance.now() - inicio);
    const faltando = contem.filter((t) => !corpo.includes(t));
    const ok = status.includes(res.status) && faltando.length === 0;
    const detalhe = !status.includes(res.status) ? `HTTP ${res.status}` : faltando.length ? `falta: ${faltando.join(', ')}` : `HTTP ${res.status}`;
    resultados.push({ nome, url, ok, ms, detalhe });
    return ok ? corpo : null;
  } catch (e) {
    resultados.push({ nome, url, ok: false, ms: Math.round(performance.now() - inicio), detalhe: e.name === 'TimeoutError' ? `sem resposta em ${LIMITE_MS} ms` : e.message });
    return null;
  }
}

// 1. Página principal: precisa responder 200 e trazer o app Angular.
const html = await verificar('Página principal', BASE, { contem: ['<app-root', 'Cão Saci'] });

// 2. Arquivos de que o app depende para abrir (nomes com hash mudam a cada build: lidos do HTML).
if (html) {
  for (const [nome, padrao] of [
    ['Script principal', /src="(main-[\w-]+\.js)"/],
    ['Estilos', /href="(styles-[\w-]+\.css)"/],
  ]) {
    const m = html.match(padrao);
    if (m) await verificar(nome, new URL(m[1], BASE).href);
    else resultados.push({ nome, url: '-', ok: false, ms: 0, detalhe: 'não referenciado no HTML' });
  }
}

// 3. Rota interna aberta direto: o GitHub Pages responde com o 404.html, que é o próprio app.
await verificar('Rota interna (/sobre)', new URL('sobre', BASE).href, { status: [200, 404], contem: ['<app-root'] });

// 4. Arquivos da prévia de compartilhamento e de instalação no celular.
await verificar('Imagem de prévia', new URL('og-image.jpg', BASE).href);
await verificar('Manifest', new URL('site.webmanifest', BASE).href, { contem: ['"Cão Saci"'] });

// Relatório
const no_ar = resultados.every((r) => r.ok);
const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
console.log(`\n${no_ar ? 'UP' : 'DOWN'}  ${BASE}  (${quando}, horário de Brasília)\n`);
for (const r of resultados) console.log(`  ${r.ok ? 'OK   ' : 'FALHA'}  ${r.nome.padEnd(24)} ${String(r.ms).padStart(6)} ms  ${r.detalhe}`);
console.log();

if (process.env.GITHUB_STEP_SUMMARY) {
  const linhas = resultados.map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.nome} | ${r.ms} ms | ${r.detalhe} |`).join('\n');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## ${no_ar ? '🟢 UP' : '🔴 DOWN'}: ${BASE}\n\nVerificado em ${quando} (horário de Brasília).\n\n| | Verificação | Tempo | Resultado |\n|---|---|---:|---|\n${linhas}\n`,
  );
}

process.exit(no_ar ? 0 : 1);
