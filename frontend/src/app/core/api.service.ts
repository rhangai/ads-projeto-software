import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cao, MaterialEstoque, NovoCao, ResultadoCompatibilidade } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  listarCaes(): Observable<Cao[]> {
    return this.http.get<Cao[]>(`${this.base}/caes`);
  }

  cadastrarCao(dados: NovoCao): Observable<Cao> {
    return this.http.post<Cao>(`${this.base}/caes`, dados);
  }

  aprovarMontagem(id: number): Observable<Cao> {
    return this.http.post<Cao>(`${this.base}/caes/${id}/aprovar`, {});
  }

  listarEstoque(): Observable<MaterialEstoque[]> {
    return this.http.get<MaterialEstoque[]>(`${this.base}/estoque`);
  }

  atualizarSaldo(id: number, saldo_disponivel: number): Observable<MaterialEstoque> {
    return this.http.put<MaterialEstoque>(`${this.base}/estoque/${id}`, { saldo_disponivel });
  }

  verificarCompatibilidade(): Observable<ResultadoCompatibilidade> {
    return this.http.get<ResultadoCompatibilidade>(`${this.base}/compatibilidade`);
  }
}

/** Extrai a mensagem { erro } que a API devolve, com um texto padrão de reserva. */
export function mensagemDeErro(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Sem conexão com o servidor. Verifique se a API está rodando.';
    if (typeof err.error?.erro === 'string') return err.error.erro;
  }
  return 'Algo deu errado. Tente novamente.';
}
