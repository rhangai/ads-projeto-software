import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ApiDuble, CAES, botao, criarApiDuble, erroApi, texto } from '../../testing/dubles';
import { FilaComponent } from './fila.component';

describe('FilaComponent (Tela 1: Fila de espera)', () => {
  let api: ApiDuble;

  function montar() {
    const fixture = TestBed.createComponent(FilaComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    api = criarApiDuble();
    TestBed.configureTestingModule({
      imports: [FilaComponent],
      providers: [provideRouter([]), { provide: ApiService, useValue: api }],
    });
  });

  it('mostra um cartão por cão com medidas, tutor e status', () => {
    api.listarCaes.and.returnValue(of(CAES));
    const { el } = montar();
    const cartoes = el.querySelectorAll('article');
    expect(cartoes.length).toBe(2);
    expect(texto(cartoes[0])).toContain('Rex');
    expect(texto(cartoes[0])).toContain('40 cm');
    expect(texto(cartoes[0])).toContain('60 cm');
    expect(texto(cartoes[0])).toContain('João Exemplo');
    expect(texto(cartoes[0])).toContain('Aguardando');
    expect(texto(cartoes[1])).toContain('Em montagem');
    expect(texto(el)).toContain('2 no total');
  });

  it('o botão Ligar disca só os dígitos do telefone', () => {
    api.listarCaes.and.returnValue(of(CAES));
    const { el } = montar();
    expect(botao(el, 'Ligar para João Exemplo').getAttribute('href')).toBe('tel:11900000001');
  });

  it('tem o botão flutuante de novo cadastro apontando para o formulário', () => {
    api.listarCaes.and.returnValue(of([]));
    const { el } = montar();
    expect(botao(el, 'Novo cadastro').getAttribute('href')).toBe('/fila/novo');
  });

  it('explica o que fazer quando a fila está vazia', () => {
    api.listarCaes.and.returnValue(of([]));
    const { el } = montar();
    expect(texto(el)).toContain('Nenhum cão na fila ainda.');
  });

  it('mostra o erro com ícone e texto e permite tentar de novo', () => {
    api.listarCaes.and.returnValue(erroApi(0, 'x'));
    const { fixture, el } = montar();
    const alerta = el.querySelector('[role=alert]');
    expect(texto(alerta)).toContain('Erro:');
    expect(texto(alerta)).toContain('Sem conexão');

    api.listarCaes.and.returnValue(of(CAES));
    botao(el, 'Tentar de novo').click();
    fixture.detectChanges();
    expect(el.querySelectorAll('article').length).toBe(2);
  });

  it('o botão Atualizar busca a fila de novo', () => {
    api.listarCaes.and.returnValue(of([]));
    const { el } = montar();
    botao(el, 'Atualizar').click();
    expect(api.listarCaes).toHaveBeenCalledTimes(2);
  });
});
