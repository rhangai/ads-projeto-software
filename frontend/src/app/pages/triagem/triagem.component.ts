import { Component, inject, signal } from '@angular/core';
import { ApiService, mensagemDeErro } from '../../core/api.service';
import { CaoApto, ResultadoCompatibilidade } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-triagem',
  standalone: true,
  templateUrl: './triagem.component.html',
})
export class TriagemComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly resultado = signal<ResultadoCompatibilidade | null>(null);
  readonly verificando = signal(false);
  /** Id do cão cuja aprovação está em andamento (desabilita só aquele botão). */
  readonly aprovando = signal<number | null>(null);

  verificar(): void {
    this.verificando.set(true);
    this.api.verificarCompatibilidade().subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.verificando.set(false);
      },
      error: (err) => {
        this.toast.erro(mensagemDeErro(err));
        this.verificando.set(false);
      },
    });
  }

  aprovar(cao: CaoApto): void {
    this.aprovando.set(cao.id);
    this.api.aprovarMontagem(cao.id).subscribe({
      next: () => {
        this.toast.sucesso(`Montagem de ${cao.nome_cao} aprovada. Material separado do estoque.`);
        this.aprovando.set(null);
        // O saldo mudou: refaz o cruzamento para não mostrar aptos desatualizados.
        this.verificar();
      },
      error: (err) => {
        this.toast.erro(mensagemDeErro(err));
        this.aprovando.set(null);
      },
    });
  }
}
