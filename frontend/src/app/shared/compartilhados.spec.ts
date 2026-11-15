import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../core/toast.service';
import { botao, texto } from '../testing/dubles';
import { LogoComponent } from './logo/logo.component';
import { StatusTagComponent } from './status-tag/status-tag.component';
import { ToastComponent } from './toast/toast.component';

describe('ToastComponent', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [ToastComponent] });
    const fixture = TestBed.createComponent(ToastComponent);
    const toast = TestBed.inject(ToastService);
    return { fixture, toast, el: fixture.nativeElement as HTMLElement };
  }

  it('erro: anuncia como alerta, com ícone e o texto "Erro:" (não depende só da cor)', () => {
    const { fixture, toast, el } = montar();
    toast.erro('O saldo não pode ficar negativo.');
    fixture.detectChanges();
    const alerta = el.querySelector('[role=alert]');
    expect(texto(alerta)).toBe('Erro: O saldo não pode ficar negativo.');
    expect(alerta?.querySelector('svg')).not.toBeNull();
  });

  it('sucesso: anuncia como status, com o texto "Sucesso:"', () => {
    const { fixture, toast, el } = montar();
    toast.sucesso('Ajuste salvo.');
    fixture.detectChanges();
    expect(texto(el.querySelector('[role=status]'))).toBe('Sucesso: Ajuste salvo.');
  });

  it('o X fecha o aviso', () => {
    const { fixture, toast, el } = montar();
    toast.erro('x');
    fixture.detectChanges();
    botao(el, 'Fechar aviso').click();
    fixture.detectChanges();
    expect(toast.atual()).toBeNull();
    expect(el.querySelector('[role=alert]')).toBeNull();
  });
});

describe('StatusTagComponent', () => {
  for (const [status, rotulo] of [
    ['aguardando', 'Aguardando'],
    ['em_montagem', 'Em montagem'],
    ['entregue', 'Entregue'],
  ] as const) {
    it(`mostra "${rotulo}" com ícone para ${status}`, () => {
      TestBed.configureTestingModule({ imports: [StatusTagComponent] });
      const fixture = TestBed.createComponent(StatusTagComponent);
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(texto(el)).toBe(rotulo);
      expect(el.querySelector('svg')).not.toBeNull();
    });
  }
});

@Component({ standalone: true, imports: [LogoComponent], template: '<app-logo /><app-logo />' })
class DoisLogos {}

describe('LogoComponent', () => {
  it('cada logo na página usa um id de recorte próprio', () => {
    TestBed.configureTestingModule({ imports: [DoisLogos] });
    const fixture = TestBed.createComponent(DoisLogos);
    fixture.detectChanges();
    const ids = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('clipPath')).map((c) => c.id);
    expect(ids.length).toBe(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
