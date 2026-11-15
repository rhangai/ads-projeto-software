import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService, mensagemDeErro } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista os cães com GET /api/caes', () => {
    api.listarCaes().subscribe();
    expect(http.expectOne('/api/caes').request.method).toBe('GET');
  });

  it('cadastra com POST /api/caes enviando os dados do formulário', () => {
    const dados = { nome_cao: 'Thor', nome_tutor: 'Ana', telefone_tutor: '11900000000', altura_cm: 30, comprimento_cm: 50 };
    api.cadastrarCao(dados).subscribe();
    const req = http.expectOne('/api/caes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dados);
  });

  it('aprova com POST /api/caes/:id/aprovar', () => {
    api.aprovarMontagem(7).subscribe();
    expect(http.expectOne('/api/caes/7/aprovar').request.method).toBe('POST');
  });

  it('lista o estoque com GET /api/estoque', () => {
    api.listarEstoque().subscribe();
    expect(http.expectOne('/api/estoque').request.method).toBe('GET');
  });

  it('ajusta o saldo enviando só a variação, com PATCH', () => {
    api.ajustarSaldo(2, -3).subscribe();
    const req = http.expectOne('/api/estoque/2');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ delta: -3 });
  });

  it('verifica compatibilidade com GET /api/compatibilidade', () => {
    api.verificarCompatibilidade().subscribe();
    expect(http.expectOne('/api/compatibilidade').request.method).toBe('GET');
  });
});

describe('mensagemDeErro', () => {
  it('usa a mensagem { erro } da API', () => {
    const err = new HttpErrorResponse({ status: 422, error: { erro: 'O saldo não pode ficar negativo.' } });
    expect(mensagemDeErro(err)).toBe('O saldo não pode ficar negativo.');
  });

  it('avisa quando o servidor não responde (status 0)', () => {
    expect(mensagemDeErro(new HttpErrorResponse({ status: 0 }))).toContain('Sem conexão');
  });

  it('usa um texto padrão para erro sem mensagem ou que não é HTTP', () => {
    expect(mensagemDeErro(new HttpErrorResponse({ status: 500, error: 'html' }))).toBe('Algo deu errado. Tente novamente.');
    expect(mensagemDeErro(new Error('x'))).toBe('Algo deu errado. Tente novamente.');
  });
});
