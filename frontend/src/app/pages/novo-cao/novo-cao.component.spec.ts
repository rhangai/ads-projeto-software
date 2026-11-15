import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ApiDuble, CAES, criarApiDuble, erroApi, texto } from '../../testing/dubles';
import { NovoCaoComponent } from './novo-cao.component';

describe('NovoCaoComponent (cadastro)', () => {
  let api: ApiDuble;
  let toast: ToastService;
  let router: Router;

  const valido = { nome_cao: 'Thor', nome_tutor: 'Ana Exemplo', telefone_tutor: '(11) 90000-0004', altura_cm: 35, comprimento_cm: 55 };

  function montar() {
    const fixture = TestBed.createComponent(NovoCaoComponent);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    api = criarApiDuble();
    TestBed.configureTestingModule({
      imports: [NovoCaoComponent],
      providers: [provideRouter([]), { provide: ApiService, useValue: api }],
    });
    toast = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  it('começa com as medidas vazias, sem "0"', () => {
    const { el } = montar();
    expect((el.querySelector('#altura_cm') as HTMLInputElement).value).toBe('');
    expect((el.querySelector('#comprimento_cm') as HTMLInputElement).value).toBe('');
  });

  it('não envia formulário inválido: destaca os campos e avisa', () => {
    const { fixture, el } = montar();
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(api.cadastrarCao).not.toHaveBeenCalled();
    expect(toast.atual()?.tipo).toBe('erro');
    expect(texto(el)).toContain('Escreva o nome do cão.');
    expect(el.querySelector('#nome_cao')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('recusa nome com mais de 60 caracteres e telefone sem DDD', () => {
    const { comp } = montar();
    comp.form.setValue({ ...valido, nome_cao: 'A'.repeat(61), telefone_tutor: '90000-0004' });
    expect(comp.form.controls.nome_cao.hasError('maxlength')).toBeTrue();
    expect(comp.form.controls.telefone_tutor.hasError('telefone')).toBeTrue();
  });

  it('valida o telefone contando dígitos, como a API', () => {
    const { comp } = montar();
    const tel = comp.form.controls.telefone_tutor;
    for (const ok of ['(11) 90000-0004', '11900000004', '+55 11 90000-0004', '(11) 3000-0000']) {
      tel.setValue(ok);
      expect(tel.valid).withContext(ok).toBeTrue();
    }
    for (const ruim of ['90000-0004', '(11) 9000', '11 9000a-0000', '+55 (11) 90000-00045']) {
      tel.setValue(ruim);
      expect(tel.hasError('telefone')).withContext(ruim).toBeTrue();
    }
  });

  it('cadastra, avisa e volta para a fila', () => {
    api.cadastrarCao.and.returnValue(of({ ...CAES[0], ...valido, id: 9 }));
    const { comp } = montar();
    comp.form.setValue(valido);
    comp.salvar();
    expect(api.cadastrarCao).toHaveBeenCalledWith(valido);
    expect(toast.atual()).toEqual({ tipo: 'sucesso', mensagem: 'Thor entrou na fila de espera.' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/fila');
  });

  it('mostra o erro da API e libera o botão de novo', () => {
    api.cadastrarCao.and.returnValue(erroApi(400, 'Informe o telefone com DDD.'));
    const { comp } = montar();
    comp.form.setValue(valido);
    comp.salvar();
    expect(toast.atual()).toEqual({ tipo: 'erro', mensagem: 'Informe o telefone com DDD.' });
    expect(comp.enviando()).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
