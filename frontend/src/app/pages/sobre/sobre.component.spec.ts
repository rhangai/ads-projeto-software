import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { botao, texto } from '../../testing/dubles';
import { SobreComponent } from './sobre.component';

describe('SobreComponent (página Sobre)', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [SobreComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SobreComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('explica para quem são as cadeiras e de onde vem o nome', () => {
    const el = montar();
    expect(texto(el.querySelector('h1'))).toBe('Sobre o Cão Saci');
    expect(texto(el)).toContain('cachorros mancos e pernetas');
    expect(texto(el)).toContain('Saci-Pererê');
  });

  it('mostra os três passos do sistema em ordem, cada um com link para a tela', () => {
    const el = montar();
    const passos = Array.from(el.querySelectorAll('ol > li'));
    expect(passos.map((p) => texto(p.querySelector('h3')))).toEqual(['Fila de espera', 'Triagem', 'Estoque']);
    expect(passos.map((p) => p.querySelector('a')?.getAttribute('href'))).toEqual(['/fila', '/triagem', '/estoque']);
  });

  it('avisa que os dados de exemplo são fictícios e liga para o código', () => {
    const el = montar();
    expect(texto(el)).toContain('são fictícios');
    const github = botao(el, 'Ver o código no GitHub') as unknown as HTMLAnchorElement;
    expect(github.href).toBe('https://github.com/rhangai/ads-projeto-software');
    expect(github.rel).toContain('noopener');
  });

  it('tem um título por seção para quem navega com leitor de tela', () => {
    const el = montar();
    for (const secao of Array.from(el.querySelectorAll('section'))) {
      const id = secao.getAttribute('aria-labelledby');
      expect(id && el.querySelector(`#${id}`)).withContext(secao.textContent!.slice(0, 40)).toBeTruthy();
    }
  });
});
