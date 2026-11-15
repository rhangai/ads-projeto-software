import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent, RECARREGAR_PAGINA } from './app.component';
import { routes } from './app.routes';
import { texto } from './testing/dubles';

describe('AppComponent (moldura e navegação)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter(routes)] });
  });

  it('tem a barra de navegação com as telas e a página Sobre', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('nav a'));
    expect(links.map((a) => texto(a))).toEqual(['Fila', 'Triagem', 'Estoque', 'Sobre']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/fila', '/triagem', '/estoque', '/sobre']);
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Navegação principal');
  });

  it('fora do modo demonstração não mostra a faixa amarela', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.modoMock).toBeFalse();
    expect(texto(fixture.nativeElement)).not.toContain('Modo demonstração');
  });

  it('"Restaurar exemplo" apaga os dados salvos do modo demonstração e recarrega', () => {
    const recarregar = jasmine.createSpy('recarregar');
    TestBed.overrideProvider(RECARREGAR_PAGINA, { useValue: recarregar });
    localStorage.setItem('cao-saci:mock:v1', '{"caes":[],"estoque":[]}');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.restaurarExemplo();
    expect(localStorage.getItem('cao-saci:mock:v1')).toBeNull();
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('cada rota carrega a tela certa', async () => {
    const carregadas = await Promise.all(
      routes.filter((r) => r.loadComponent).map(async (r) => [r.path, ((await r.loadComponent!()) as { name: string }).name]),
    );
    expect(carregadas).toEqual([
      ['fila', 'FilaComponent'],
      ['fila/novo', 'NovoCaoComponent'],
      ['triagem', 'TriagemComponent'],
      ['estoque', 'EstoqueComponent'],
      ['sobre', 'SobreComponent'],
    ]);
  });
});
