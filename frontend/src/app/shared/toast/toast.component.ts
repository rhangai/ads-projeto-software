import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

/**
 * Alerta flutuante. Nunca depende só da cor: sempre traz ícone + rótulo em
 * texto ("Erro:" / "Pronto:") + mensagem, e é anunciado por leitores de tela.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
