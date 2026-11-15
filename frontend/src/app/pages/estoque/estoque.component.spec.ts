import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ApiDuble, ESTOQUE, botao, criarApiDuble, erroApi, texto } from '../../testing/dubles';
import { EstoqueComponent } from './estoque.component';

describe('EstoqueComponent (Tela 3: Estoque e alertas)', () => {
  let api: ApiDuble;
  let toast: ToastService;

  function montar() {
    const fixture = TestBed.createComponent(EstoqueComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const qtd = (id: number) => el.querySelector(`#qtd-${id}`) as HTMLInputElement;
    return { fixture, comp: fixture.componentInstance, el, qtd };
  }

  beforeEach(() => {
    api = criarApiDuble();
    api.listarEstoque.and.returnValue(of(structuredClone(ESTOQUE)));
    TestBed.configureTestingModule({ imports: [EstoqueComponent], providers: [{ provide: ApiService, useValue: api }] });
    toast = TestBed.inject(ToastService);
  });

  it('mostra cada material com a quantidade atual', () => {
    const { el, qtd } = montar();
    expect(el.querySelectorAll('section').length).toBe(2);
    expect(qtd(1).value).toBe('10');
    expect(qtd(2).value).toBe('1');
    expect(texto(el)).toContain('Nenhuma mudança para salvar');
  });

  it('+ e − mudam o rascunho e marcam o que falta salvar', () => {
    const { fixture, el, qtd } = montar();
    botao(el, 'Somar 1 em Cano de PVC').click();
    botao(el, 'Somar 1 em Cano de PVC').click();
    fixture.detectChanges();
    expect(qtd(1).value).toBe('12');
    expect(texto(el)).toContain('Falta salvar · antes: 10');
    expect(texto(el)).toContain('Salvar Ajuste (1)');
    expect(api.ajustarSaldo).not.toHaveBeenCalled();
  });

  it('bloqueia saldo negativo com alerta de ícone e texto', () => {
    const { fixture, el, qtd } = montar();
    botao(el, 'Tirar 1 de Rodinha').click(); // 1 -> 0
    botao(el, 'Tirar 1 de Rodinha').click(); // 0 -> bloqueado
    fixture.detectChanges();
    expect(qtd(2).value).toBe('0');
    expect(toast.atual()).toEqual({ tipo: 'erro', mensagem: 'O saldo não pode ficar negativo.' });
  });

  it('aceita quantidade digitada e recusa número negativo ou quebrado', () => {
    const { comp, qtd } = montar();
    const digitar = (valor: string) => {
      qtd(1).value = valor;
      qtd(1).dispatchEvent(new Event('change'));
    };
    digitar('25');
    expect(comp.saldo(comp.materiais()[0])).toBe(25);

    digitar('-3');
    expect(toast.atual()?.mensagem).toBe('O saldo não pode ficar negativo.');
    expect(qtd(1).value).toBe('25');

    digitar('2.5');
    expect(toast.atual()?.mensagem).toBe('Digite um número inteiro.');
    expect(qtd(1).value).toBe('25');
  });

  it('Salvar Ajuste envia só a variação dos itens alterados', () => {
    api.ajustarSaldo.and.callFake((id, delta) => of({ ...ESTOQUE.find((m) => m.id === id)!, saldo_disponivel: 10 + delta }));
    const { fixture, el, qtd } = montar();
    botao(el, 'Somar 1 em Cano de PVC').click();
    botao(el, 'Somar 1 em Cano de PVC').click();
    botao(el, 'Somar 1 em Cano de PVC').click();
    fixture.detectChanges();
    botao(el, 'Salvar Ajuste').click();
    fixture.detectChanges();

    expect(api.ajustarSaldo).toHaveBeenCalledOnceWith(1, 3);
    expect(toast.atual()).toEqual({ tipo: 'sucesso', mensagem: 'Ajuste de estoque salvo.' });
    expect(qtd(1).value).toBe('13');
    expect(texto(el)).toContain('Nenhuma mudança para salvar');
  });

  it('se o servidor recusar, mostra o erro e recarrega o saldo real', () => {
    api.ajustarSaldo.and.returnValue(erroApi(422, 'O saldo não pode ficar negativo.'));
    const { fixture, el } = montar();
    botao(el, 'Tirar 1 de Rodinha').click();
    fixture.detectChanges();
    botao(el, 'Salvar Ajuste').click();
    expect(toast.atual()?.mensagem).toBe('O saldo não pode ficar negativo.');
    expect(api.listarEstoque).toHaveBeenCalledTimes(2);
  });

  it('Salvar sem mudanças não chama a API', () => {
    const { comp } = montar();
    comp.salvar();
    expect(api.ajustarSaldo).not.toHaveBeenCalled();
  });

  it('avisa quando não consegue carregar o estoque', () => {
    api.listarEstoque.and.returnValue(erroApi(0, ''));
    montar();
    expect(toast.atual()?.mensagem).toContain('Sem conexão');
  });
});
