import { formatNumber } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { appConfig } from './app.config';

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
  });

  it('usa o português do Brasil para formatar números', () => {
    const locale = TestBed.inject(LOCALE_ID);
    expect(locale).toBe('pt-BR');
    expect(formatNumber(1234.56, locale, '1.2-2')).toBe('1.234,56');
  });

  it('registra as rotas das telas', () => {
    const caminhos = TestBed.inject(Router).config.map((r) => r.path);
    expect(caminhos).toEqual(jasmine.arrayContaining(['fila', 'fila/novo', 'triagem', 'estoque']));
  });

  it('fora do modo demonstração, /api vai para o servidor de verdade', () => {
    let resposta: unknown;
    TestBed.inject(HttpClient).get('/api/estoque').subscribe((r) => (resposta = r));
    TestBed.inject(HttpTestingController).expectOne('/api/estoque').flush([{ id: 1 }]);
    expect(resposta).toEqual([{ id: 1 }]);
  });
});
