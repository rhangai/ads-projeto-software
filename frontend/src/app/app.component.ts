import { Component, InjectionToken, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { restaurarDadosExemplo } from './mock/mock-api.interceptor';
import { LogoComponent } from './shared/logo/logo.component';
import { ToastComponent } from './shared/toast/toast.component';

/** Recarrega a página. Injetável para os testes trocarem por um dublê (location.reload não pode ser espionado). */
export const RECARREGAR_PAGINA = new InjectionToken<() => void>('RECARREGAR_PAGINA', {
  providedIn: 'root',
  factory: () => () => location.reload(),
});

interface ItemNav {
  rota: string;
  rotulo: string;
  icone: string; // path SVG (Heroicons outline)
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, LogoComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly modoMock = environment.mock;
  private readonly recarregar = inject(RECARREGAR_PAGINA);

  /** Só no modo mock: recomeça com os dados de exemplo e recarrega as telas. */
  restaurarExemplo(): void {
    restaurarDadosExemplo();
    this.recarregar();
  }

  readonly navegacao: ItemNav[] = [
    {
      rota: '/fila',
      rotulo: 'Fila',
      icone: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm0 5.25h.007v.008H3.75V12Zm0 5.25h.007v.008H3.75v-.008Z',
    },
    {
      rota: '/triagem',
      rotulo: 'Triagem',
      icone: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
    },
    {
      rota: '/estoque',
      rotulo: 'Estoque',
      icone: 'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
    },
  ];
}
