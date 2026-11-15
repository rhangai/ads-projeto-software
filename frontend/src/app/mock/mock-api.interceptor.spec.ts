import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { mockApiInterceptor, restaurarDadosExemplo } from './mock-api.interceptor';

const LATENCIA = 400;
const CHAVE = 'cao-saci:mock:v1';

describe('mockApiInterceptor (modo demonstração)', () => {
  let http: HttpClient;
  let rede: HttpTestingController;

  /** Faz a chamada, avança o relógio da latência falsa e devolve resposta ou erro. */
  function chamar<T = any>(metodo: 'GET' | 'POST' | 'PATCH' | 'PUT', url: string, corpo?: unknown) {
    let resposta: T | undefined;
    let erro: HttpErrorResponse | undefined;
    http.request<T>(metodo, url, { body: corpo }).subscribe({ next: (r) => (resposta = r), error: (e) => (erro = e) });
    tick(LATENCIA);
    return { resposta, erro };
  }

  beforeEach(() => {
    localStorage.removeItem(CHAVE);
    restaurarDadosExemplo();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    rede = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    rede.verify();
    localStorage.removeItem(CHAVE);
  });

  it('responde /api sem ir à rede, depois da latência simulada', fakeAsync(() => {
    let caes: unknown[] | undefined;
    http.get<unknown[]>('/api/caes').subscribe((r) => (caes = r));
    tick(LATENCIA - 1);
    expect(caes).toBeUndefined();
    tick(1);
    expect(caes?.length).toBe(3);
    rede.expectNone('/api/caes');
  }));

  it('deixa passar requisições fora de /api', () => {
    let resposta: unknown;
    http.get('/assets/x.json').subscribe((r) => (resposta = r));
    rede.expectOne('/assets/x.json').flush({ ok: true });
    expect(resposta).toEqual({ ok: true });
  });

  it('também aceita o filtro de status via HttpParams', fakeAsync(() => {
    let caes: any[] = [];
    http.get<any[]>('/api/caes', { params: { status: 'em_montagem' } }).subscribe((r) => (caes = r));
    tick(LATENCIA);
    expect(caes).toEqual([]);
  }));

  it('filtra cães por status', fakeAsync(() => {
    chamar('POST', '/api/caes/1/aprovar');
    expect(chamar('GET', '/api/caes?status=aguardando').resposta.map((c: any) => c.id)).toEqual([2, 3]);
  }));

  it('cadastra um cão válido como "aguardando"', fakeAsync(() => {
    const novo = { nome_cao: 'Thor', nome_tutor: 'Ana', telefone_tutor: '(11) 90000-0004', altura_cm: 35, comprimento_cm: 55 };
    const { resposta } = chamar('POST', '/api/caes', novo);
    expect(resposta).toEqual(jasmine.objectContaining({ id: 4, status: 'aguardando' }));
    expect(chamar('GET', '/api/caes').resposta.length).toBe(4);
  }));

  it('recusa cadastro inválido com 400, como a API', fakeAsync(() => {
    const { erro } = chamar('POST', '/api/caes', { nome_cao: '', nome_tutor: 'Ana', telefone_tutor: '123', altura_cm: '40', comprimento_cm: 500 });
    expect(erro?.status).toBe(400);
    expect(erro?.error.erro).toContain('Informe o nome do cão');
    expect(erro?.error.erro).toContain('com DDD');
    expect(erro?.error.erro).toContain('Altura entre 5 e 150 cm.');
    expect(erro?.error.erro).toContain('Comprimento entre 10 e 200 cm.');
  }));

  it('aprova a montagem e debita 3 canos e 4 rodinhas do Rex', fakeAsync(() => {
    expect(chamar('POST', '/api/caes/1/aprovar').resposta.status).toBe('em_montagem');
    const estoque = chamar('GET', '/api/estoque').resposta;
    expect(estoque.map((m: any) => m.saldo_disponivel)).toEqual([7, 4]);
  }));

  it('não aprova duas vezes, nem cão inexistente, nem sem material', fakeAsync(() => {
    chamar('POST', '/api/caes/1/aprovar');
    expect(chamar('POST', '/api/caes/1/aprovar').erro?.status).toBe(409);
    expect(chamar('POST', '/api/caes/99/aprovar').erro?.status).toBe(404);
    chamar('POST', '/api/caes/2/aprovar'); // rodinhas acabam (8 - 4 - 4)
    const { erro } = chamar('POST', '/api/caes/3/aprovar');
    expect(erro?.status).toBe(409);
    expect(erro?.error.erro).toContain('Saldo insuficiente');
  }));

  it('ajusta o estoque por variação e barra saldo negativo com 422', fakeAsync(() => {
    expect(chamar('PATCH', '/api/estoque/1', { delta: 5 }).resposta.saldo_disponivel).toBe(15);
    const { erro } = chamar('PATCH', '/api/estoque/2', { delta: -9 });
    expect(erro?.status).toBe(422);
    expect(erro?.error.erro).toBe('O saldo não pode ficar negativo.');
  }));

  it('recusa variação inválida (400) e material inexistente (404)', fakeAsync(() => {
    expect(chamar('PATCH', '/api/estoque/1', { delta: 0 }).erro?.status).toBe(400);
    expect(chamar('PATCH', '/api/estoque/1', { delta: '2' }).erro?.status).toBe(400);
    expect(chamar('PATCH', '/api/estoque/99', { delta: 1 }).erro?.status).toBe(404);
  }));

  it('cruza fila e estoque como a API', fakeAsync(() => {
    const r = chamar('GET', '/api/compatibilidade').resposta;
    expect(r.aptos.map((c: any) => c.nome_cao)).toEqual(['Rex', 'Luna']);
    expect(r.saldo_apos_aptos).toEqual({ canos_pvc: 5, rodas: 0 });
  }));

  it('responde 404 para rota que não existe', fakeAsync(() => {
    expect(chamar('PUT', '/api/estoque/1', { saldo_disponivel: 3 }).erro?.status).toBe(404);
  }));

  it('salva no localStorage depois de cada alteração', fakeAsync(() => {
    chamar('GET', '/api/estoque');
    expect(localStorage.getItem(CHAVE)).toBeNull(); // leitura não grava
    chamar('PATCH', '/api/estoque/1', { delta: 2 });
    expect(JSON.parse(localStorage.getItem(CHAVE)!).estoque[0].saldo_disponivel).toBe(12);
  }));

  it('restaurarDadosExemplo volta ao início e apaga o que estava salvo', fakeAsync(() => {
    chamar('PATCH', '/api/estoque/1', { delta: 2 });
    restaurarDadosExemplo();
    expect(localStorage.getItem(CHAVE)).toBeNull();
    expect(chamar('GET', '/api/estoque').resposta[0].saldo_disponivel).toBe(10);
  }));

  it('as telas recebem cópias, não o estado interno', fakeAsync(() => {
    const lista = chamar('GET', '/api/estoque').resposta;
    lista[0].saldo_disponivel = 999;
    expect(chamar('GET', '/api/estoque').resposta[0].saldo_disponivel).toBe(10);
  }));
});
