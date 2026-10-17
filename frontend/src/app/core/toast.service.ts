import { Injectable, signal } from '@angular/core';

export type TipoToast = 'erro' | 'sucesso';

export interface Toast {
  tipo: TipoToast;
  mensagem: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly atual = signal<Toast | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  erro(mensagem: string): void {
    this.mostrar({ tipo: 'erro', mensagem });
  }

  sucesso(mensagem: string): void {
    this.mostrar({ tipo: 'sucesso', mensagem });
  }

  fechar(): void {
    clearTimeout(this.timer);
    this.atual.set(null);
  }

  private mostrar(toast: Toast): void {
    clearTimeout(this.timer);
    this.atual.set(toast);
    // Erros ficam mais tempo na tela para dar tempo de ler.
    this.timer = setTimeout(() => this.atual.set(null), toast.tipo === 'erro' ? 8000 : 4000);
  }
}
