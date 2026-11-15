// Dados e dublês compartilhados pelos testes das telas.
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Cao, MaterialEstoque } from '../core/models';

export const CAES: Cao[] = [
  { id: 1, nome_cao: 'Rex', nome_tutor: 'João Exemplo', telefone_tutor: '(11) 90000-0001', altura_cm: 40, comprimento_cm: 60, status: 'aguardando' },
  { id: 2, nome_cao: 'Luna', nome_tutor: 'Maria Exemplo', telefone_tutor: '(11) 90000-0002', altura_cm: 25, comprimento_cm: 45, status: 'em_montagem' },
];

export const ESTOQUE: MaterialEstoque[] = [
  { id: 1, nome_material: 'Cano de PVC', categoria_material: 'cano_pvc', saldo_disponivel: 10 },
  { id: 2, nome_material: 'Rodinha', categoria_material: 'roda', saldo_disponivel: 1 },
];

export type ApiDuble = jasmine.SpyObj<ApiService>;

export function criarApiDuble(): ApiDuble {
  return jasmine.createSpyObj<ApiService>('ApiService', [
    'listarCaes',
    'cadastrarCao',
    'aprovarMontagem',
    'listarEstoque',
    'ajustarSaldo',
    'verificarCompatibilidade',
  ]);
}

/** Erro HTTP no formato da API: { erro: mensagem }. */
export function erroApi(status: number, erro: string) {
  return throwError(() => new HttpErrorResponse({ status, error: { erro } }));
}

/** Texto visível do elemento, com espaços normalizados. */
export function texto(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Botão pelo texto visível (ou aria-label). */
export function botao(raiz: HTMLElement, rotulo: string): HTMLButtonElement {
  const todos = Array.from(raiz.querySelectorAll<HTMLButtonElement>('button, a'));
  const achado = todos.find((b) => texto(b).includes(rotulo) || b.getAttribute('aria-label')?.includes(rotulo));
  if (!achado) throw new Error(`Botão "${rotulo}" não encontrado`);
  return achado as HTMLButtonElement;
}
