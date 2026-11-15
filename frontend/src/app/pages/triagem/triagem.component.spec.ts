import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ResultadoCompatibilidade } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { ApiDuble, CAES, botao, criarApiDuble, erroApi, texto } from '../../testing/dubles';
import { TriagemComponent } from './triagem.component';

describe('TriagemComponent (Tela 2: Cruzamento de dados)', () => {
  let api: ApiDuble;
  let toast: ToastService;

  const resultado: ResultadoCompatibilidade = {
    aptos: [{ ...CAES[0], consumo: { canos_pvc: 3, rodas: 4 } }],
    saldo_atual: { canos_pvc: 10, rodas: 8 },
    saldo_apos_aptos: { canos_pvc: 7, rodas: 4 },
  };

  function montar() {
    const fixture = TestBed.createComponent(TriagemComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    api = criarApiDuble();
    TestBed.configureTestingModule({ imports: [TriagemComponent], providers: [{ provide: ApiService, useValue: api }] });
    toast = TestBed.inject(ToastService);
  });

  it('antes de verificar, explica que nada sai do estoque até aprovar', () => {
    const { el } = montar();
    expect(texto(el)).toContain('Nada sai do estoque até você aprovar.');
    expect(api.verificarCompatibilidade).not.toHaveBeenCalled();
  });

  it('Verificar Compatibilidade mostra o saldo e os cães aptos com o consumo', () => {
    api.verificarCompatibilidade.and.returnValue(of(resultado));
    const { fixture, el } = montar();
    botao(el, 'Verificar Compatibilidade').click();
    fixture.detectChanges();

    expect(texto(el)).toContain('Cães aptos: 1');
    const cartao = el.querySelector('article');
    expect(texto(cartao)).toContain('Rex');
    expect(texto(cartao)).toContain('3 canos de PVC');
    expect(texto(cartao)).toContain('4 rodinhas');
    expect(texto(cartao)).toContain('Saldo suficiente');
    expect(texto(el)).toContain('sobram 7 canos e 4 rodinhas');
  });

  it('usa "cano" no singular quando é um só', () => {
    api.verificarCompatibilidade.and.returnValue(of({ ...resultado, aptos: [{ ...CAES[0], consumo: { canos_pvc: 1, rodas: 4 } }] }));
    const { fixture, el } = montar();
    botao(el, 'Verificar').click();
    fixture.detectChanges();
    expect(texto(el.querySelector('article'))).toContain('1 cano de PVC');
  });

  it('avisa quando ninguém cabe no estoque', () => {
    api.verificarCompatibilidade.and.returnValue(of({ ...resultado, aptos: [] }));
    const { fixture, el } = montar();
    botao(el, 'Verificar').click();
    fixture.detectChanges();
    expect(texto(el)).toContain('Nenhum cão da fila cabe nas peças de agora.');
  });

  it('mostra erro da verificação no aviso', () => {
    api.verificarCompatibilidade.and.returnValue(erroApi(0, ''));
    const { fixture, el } = montar();
    botao(el, 'Verificar').click();
    fixture.detectChanges();
    expect(toast.atual()?.tipo).toBe('erro');
  });

  it('Aprovar Montagem aprova, avisa e refaz o cruzamento', () => {
    api.verificarCompatibilidade.and.returnValue(of(resultado));
    api.aprovarMontagem.and.returnValue(of({ ...CAES[0], status: 'em_montagem' }));
    const { fixture, el } = montar();
    botao(el, 'Verificar').click();
    fixture.detectChanges();

    botao(el, 'Aprovar Montagem').click();
    expect(api.aprovarMontagem).toHaveBeenCalledWith(1);
    expect(toast.atual()?.mensagem).toContain('Montagem de Rex aprovada');
    expect(api.verificarCompatibilidade).toHaveBeenCalledTimes(2);
  });

  it('se a aprovação falhar, mostra o erro e libera os botões', () => {
    api.verificarCompatibilidade.and.returnValue(of(resultado));
    api.aprovarMontagem.and.returnValue(erroApi(409, 'Saldo insuficiente para montar a cadeira de Rex.'));
    const { fixture, el } = montar();
    botao(el, 'Verificar').click();
    fixture.detectChanges();
    botao(el, 'Aprovar Montagem').click();
    fixture.detectChanges();
    expect(toast.atual()).toEqual({ tipo: 'erro', mensagem: 'Saldo insuficiente para montar a cadeira de Rex.' });
    expect(botao(el, 'Aprovar Montagem').disabled).toBeFalse();
  });
});
