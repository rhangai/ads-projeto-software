import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';

interface Passo {
  titulo: string;
  texto: string;
  rota: string;
  acao: string;
}

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './sobre.component.html',
})
export class SobreComponent {
  readonly repositorio = 'https://github.com/rhangai/ads-projeto-software';

  /** O caminho de um cão dentro do sistema, na ordem em que acontece. */
  readonly passos: Passo[] = [
    {
      titulo: 'Fila de espera',
      texto: 'O voluntário cadastra o cão com a altura, o comprimento e o contato do tutor. Cada um entra na fila na ordem de chegada.',
      rota: '/fila',
      acao: 'Ver a fila',
    },
    {
      titulo: 'Triagem',
      texto: 'Com um toque, o sistema confere se os canos e as rodinhas do estoque bastam e mostra quem já pode receber a cadeira, sem prometer a mesma peça para dois cães.',
      rota: '/triagem',
      acao: 'Fazer a triagem',
    },
    {
      titulo: 'Estoque',
      texto: 'As peças que chegam por doação e as que saem para a montagem são registradas com botões grandes de "−" e "+". O saldo nunca fica negativo.',
      rota: '/estoque',
      acao: 'Ver o estoque',
    },
  ];
}
