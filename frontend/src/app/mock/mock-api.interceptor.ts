// API falsa em memória para rodar o front sem backend (pnpm dev:mock / build:mock).
// Imita as respostas e os erros da API real, inclusive o formato { erro }.
// Os dados ficam salvos no localStorage do navegador; restaurarDadosExemplo() recomeça.
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { switchMap, throwError, of, timer } from 'rxjs';

type Status = 'aguardando' | 'em_montagem' | 'entregue';

interface Cao {
  id: number;
  nome_cao: string;
  nome_tutor: string;
  telefone_tutor: string;
  altura_cm: number;
  comprimento_cm: number;
  status: Status;
}

interface Material {
  id: number;
  nome_material: string;
  categoria_material: 'cano_pvc' | 'roda' | 'conector' | 'outro';
  saldo_disponivel: number;
}

interface Consumo {
  canos_pvc: number;
  rodas: number;
}

/** Atraso artificial para os estados "Verificando…" e "Salvando…" aparecerem. */
const LATENCIA_MS = 400;

/** Mude o sufixo se o formato dos dados mudar, para não ler dados antigos. */
const CHAVE_STORAGE = 'cao-saci:mock:v1';

interface Estado {
  caes: Cao[];
  estoque: Material[];
}

let estado: Estado = carregar();

/** Volta aos dados de exemplo e apaga o que estava salvo no navegador. */
export function restaurarDadosExemplo(): void {
  estado = dadosExemplo();
  try {
    localStorage.removeItem(CHAVE_STORAGE);
  } catch {
    // Navegação privada ou armazenamento bloqueado: segue só em memória.
  }
}

function carregar(): Estado {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo) return JSON.parse(salvo) as Estado;
  } catch {
    // JSON corrompido ou armazenamento bloqueado: usa o exemplo.
  }
  return dadosExemplo();
}

function salvar(): void {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
  } catch {
    // Sem armazenamento disponível: os dados ficam só em memória até recarregar.
  }
}

function dadosExemplo(): Estado {
  return {
    caes: [
      { id: 1, nome_cao: 'Rex', nome_tutor: 'João Exemplo', telefone_tutor: '(11) 90000-0001', altura_cm: 40, comprimento_cm: 60, status: 'aguardando' },
      { id: 2, nome_cao: 'Luna', nome_tutor: 'Maria Exemplo', telefone_tutor: '(11) 90000-0002', altura_cm: 25, comprimento_cm: 45, status: 'aguardando' },
      { id: 3, nome_cao: 'Bob', nome_tutor: 'Ana Exemplo', telefone_tutor: '(11) 90000-0003', altura_cm: 30, comprimento_cm: 50, status: 'aguardando' },
    ],
    estoque: [
      { id: 1, nome_material: 'Cano de PVC 20 mm (barra de 1 m)', categoria_material: 'cano_pvc', saldo_disponivel: 10 },
      { id: 2, nome_material: 'Rodinha de silicone 50 mm', categoria_material: 'roda', saldo_disponivel: 8 },
    ],
  };
}

class ErroApi extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);

  return timer(LATENCIA_MS).pipe(
    switchMap(() => {
      try {
        const { status, body } = rotear(req);
        if (req.method !== 'GET') salvar();
        // structuredClone: as telas nunca recebem referência ao estado interno.
        return of(new HttpResponse({ status, body: structuredClone(body), url: req.url }));
      } catch (e) {
        if (!(e instanceof ErroApi)) throw e;
        return throwError(
          () => new HttpErrorResponse({ status: e.status, error: { erro: e.message }, url: req.url }),
        );
      }
    }),
  );
};

function rotear(req: HttpRequest<unknown>): { status: number; body: unknown } {
  const caminho = req.url.replace(/^\/api/, '').split('?')[0];
  const rota = `${req.method} ${caminho}`;
  let m: RegExpMatchArray | null;

  if (rota === 'GET /caes') {
    const status = req.params.get('status');
    return ok(status ? estado.caes.filter((c) => c.status === status) : estado.caes);
  }
  if (rota === 'POST /caes') return { status: 201, body: cadastrar(req.body) };
  if ((m = rota.match(/^POST \/caes\/(\d+)\/aprovar$/))) return ok(aprovar(Number(m[1])));
  if (rota === 'GET /estoque') return ok(estado.estoque);
  if ((m = rota.match(/^PUT \/estoque\/(\d+)$/))) return ok(ajustarSaldo(Number(m[1]), req.body));
  if (rota === 'GET /compatibilidade') return ok(compatibilidade());

  throw new ErroApi(404, 'Rota não encontrada.');
}

const ok = (body: unknown) => ({ status: 200, body });

// ---- Regras: manter em sincronia com backend/src/models/compatibilidade.ts ----

function calcularConsumo(alturaCm: number, comprimentoCm: number): Consumo {
  return { canos_pvc: Math.ceil((2 * comprimentoCm + 4 * alturaCm) / 100), rodas: 4 };
}

function saldo(): Consumo {
  const soma = (cat: Material['categoria_material']) =>
    estado.estoque.filter((m) => m.categoria_material === cat).reduce((t, m) => t + m.saldo_disponivel, 0);
  return { canos_pvc: soma('cano_pvc'), rodas: soma('roda') };
}

function compatibilidade() {
  const saldoAtual = saldo();
  const restante = { ...saldoAtual };
  const aptos = [];
  for (const cao of estado.caes.filter((c) => c.status === 'aguardando')) {
    const consumo = calcularConsumo(cao.altura_cm, cao.comprimento_cm);
    if (consumo.canos_pvc <= restante.canos_pvc && consumo.rodas <= restante.rodas) {
      aptos.push({ ...cao, consumo });
      restante.canos_pvc -= consumo.canos_pvc;
      restante.rodas -= consumo.rodas;
    }
  }
  return { aptos, saldo_atual: saldoAtual, saldo_apos_aptos: restante };
}

function cadastrar(corpo: unknown): Cao {
  const d = (corpo ?? {}) as Partial<Cao>;
  const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const inteiro = (v: unknown) => (Number.isInteger(Number(v)) ? Number(v) : NaN);

  const novo: Cao = {
    id: Math.max(0, ...estado.caes.map((c) => c.id)) + 1,
    nome_cao: texto(d.nome_cao),
    nome_tutor: texto(d.nome_tutor),
    telefone_tutor: texto(d.telefone_tutor),
    altura_cm: inteiro(d.altura_cm),
    comprimento_cm: inteiro(d.comprimento_cm),
    status: 'aguardando',
  };

  const erros = [
    !novo.nome_cao && 'Informe o nome do cão.',
    !novo.nome_tutor && 'Informe o nome do tutor.',
    novo.telefone_tutor.length < 8 && 'Informe um telefone válido.',
    !(novo.altura_cm >= 5 && novo.altura_cm <= 150) && 'Altura entre 5 e 150 cm.',
    !(novo.comprimento_cm >= 10 && novo.comprimento_cm <= 200) && 'Comprimento entre 10 e 200 cm.',
  ].filter(Boolean);
  if (erros.length) throw new ErroApi(400, erros.join(' '));

  estado.caes.push(novo);
  return novo;
}

function aprovar(id: number): Cao {
  const cao = estado.caes.find((c) => c.id === id);
  if (!cao) throw new ErroApi(404, 'Cão não encontrado.');
  if (cao.status !== 'aguardando') throw new ErroApi(409, `${cao.nome_cao} não está aguardando montagem.`);

  const consumo = calcularConsumo(cao.altura_cm, cao.comprimento_cm);
  const atual = saldo();
  if (consumo.canos_pvc > atual.canos_pvc || consumo.rodas > atual.rodas) {
    throw new ErroApi(409, `Saldo insuficiente para montar a cadeira de ${cao.nome_cao}.`);
  }

  debitar('cano_pvc', consumo.canos_pvc);
  debitar('roda', consumo.rodas);
  cao.status = 'em_montagem';
  return cao;
}

function debitar(categoria: Material['categoria_material'], quantidade: number): void {
  let falta = quantidade;
  for (const item of estado.estoque.filter((m) => m.categoria_material === categoria)) {
    const retirar = Math.min(item.saldo_disponivel, falta);
    item.saldo_disponivel -= retirar;
    falta -= retirar;
  }
}

function ajustarSaldo(id: number, corpo: unknown): Material {
  const valor = (corpo as { saldo_disponivel?: unknown } | null)?.saldo_disponivel;
  if (typeof valor !== 'number' || !Number.isInteger(valor)) {
    throw new ErroApi(400, 'O saldo deve ser um número inteiro.');
  }
  if (valor < 0) throw new ErroApi(422, 'O saldo não pode ficar negativo.');

  const material = estado.estoque.find((m) => m.id === id);
  if (!material) throw new ErroApi(404, 'Material não encontrado.');
  material.saldo_disponivel = valor;
  return material;
}
