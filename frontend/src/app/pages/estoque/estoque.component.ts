import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService, mensagemDeErro } from '../../core/api.service';
import { MaterialEstoque } from '../../core/models';
import { ToastService } from '../../core/toast.service';

const MSG_NEGATIVO = 'O saldo não pode ficar negativo.';

@Component({
  selector: 'app-estoque',
  standalone: true,
  templateUrl: './estoque.component.html',
  // Ocupa a altura toda para a barra "Salvar Ajuste" ficar presa ao rodapé.
  host: { class: 'flex flex-1 flex-col' },
})
export class EstoqueComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly materiais = signal<MaterialEstoque[]>([]);
  /** Saldos editados na tela e ainda não salvos, por id do material. */
  readonly rascunho = signal<Record<number, number>>({});
  readonly carregando = signal(true);
  readonly salvando = signal(false);

  readonly alterados = computed(() =>
    this.materiais().filter((m) => this.saldo(m) !== m.saldo_disponivel),
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.listarEstoque().subscribe({
      next: (lista) => {
        this.materiais.set(lista);
        this.rascunho.set({});
        this.carregando.set(false);
      },
      error: (err) => {
        this.toast.erro(mensagemDeErro(err));
        this.carregando.set(false);
      },
    });
  }

  saldo(m: MaterialEstoque): number {
    return this.rascunho()[m.id] ?? m.saldo_disponivel;
  }

  alterar(m: MaterialEstoque, delta: number): void {
    this.definir(m, this.saldo(m) + delta);
  }

  digitar(m: MaterialEstoque, evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const valor = Number(campo.value);
    if (!Number.isInteger(valor)) {
      this.toast.erro('Digite um número inteiro.');
      campo.value = String(this.saldo(m));
      return;
    }
    if (!this.definir(m, valor)) campo.value = String(this.saldo(m));
  }

  /** Aplica o novo saldo no rascunho. Bloqueia valores negativos com um alerta. */
  private definir(m: MaterialEstoque, valor: number): boolean {
    if (valor < 0) {
      this.toast.erro(MSG_NEGATIVO);
      return false;
    }
    this.rascunho.update((r) => ({ ...r, [m.id]: valor }));
    return true;
  }

  salvar(): void {
    const alterados = this.alterados();
    if (alterados.length === 0) return;

    this.salvando.set(true);
    forkJoin(alterados.map((m) => this.api.atualizarSaldo(m.id, this.saldo(m)))).subscribe({
      next: (atualizados) => {
        const porId = new Map(atualizados.map((a) => [a.id, a]));
        this.materiais.update((lista) => lista.map((m) => porId.get(m.id) ?? m));
        this.rascunho.set({});
        this.salvando.set(false);
        this.toast.sucesso('Ajuste de estoque salvo.');
      },
      error: (err) => {
        // A API também barra saldo negativo (HTTP 422) e devolve a mesma mensagem.
        this.toast.erro(mensagemDeErro(err));
        this.salvando.set(false);
        this.carregar();
      },
    });
  }
}
