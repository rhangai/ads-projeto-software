import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let toast: ToastService;

  beforeEach(() => {
    toast = TestBed.inject(ToastService);
  });

  it('mostra erro e some depois de 8 segundos', fakeAsync(() => {
    toast.erro('Falhou.');
    expect(toast.atual()).toEqual({ tipo: 'erro', mensagem: 'Falhou.' });
    tick(7999);
    expect(toast.atual()).not.toBeNull();
    tick(1);
    expect(toast.atual()).toBeNull();
  }));

  it('mostra sucesso e some depois de 4 segundos', fakeAsync(() => {
    toast.sucesso('Salvo.');
    expect(toast.atual()?.tipo).toBe('sucesso');
    tick(4000);
    expect(toast.atual()).toBeNull();
  }));

  it('um aviso novo substitui o anterior e reinicia o tempo', fakeAsync(() => {
    toast.sucesso('Primeiro');
    tick(3000);
    toast.erro('Segundo');
    tick(1500); // o tempo do primeiro já teria acabado aqui
    expect(toast.atual()?.mensagem).toBe('Segundo');
    tick(8000);
    expect(toast.atual()).toBeNull();
  }));

  it('fecha na hora quando o voluntário toca no X', fakeAsync(() => {
    toast.erro('Falhou.');
    toast.fechar();
    expect(toast.atual()).toBeNull();
    tick(8000);
  }));
});
