// MODEL — consultas de estoque reaproveitadas pelos controllers.
import { asc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { materialEstoque, type CategoriaMaterial } from '../db/schema';
import type { Consumo } from './compatibilidade';

type DbOuTransacao = Pick<Db, 'select' | 'update'>;

export function saldoPorCategoria(db: DbOuTransacao, categoria: CategoriaMaterial): number {
  const linha = db
    .select({ total: sql<number>`coalesce(sum(${materialEstoque.saldo_disponivel}), 0)` })
    .from(materialEstoque)
    .where(eq(materialEstoque.categoria_material, categoria))
    .get();
  return Number(linha?.total ?? 0);
}

export function saldoParaCadeiras(db: DbOuTransacao): Consumo {
  return {
    canos_pvc: saldoPorCategoria(db, 'cano_pvc'),
    rodas: saldoPorCategoria(db, 'roda'),
  };
}

/** Debita `quantidade` de uma categoria, consumindo os itens na ordem de cadastro. */
export function debitarCategoria(db: DbOuTransacao, categoria: CategoriaMaterial, quantidade: number): void {
  let falta = quantidade;
  const itens = db
    .select()
    .from(materialEstoque)
    .where(eq(materialEstoque.categoria_material, categoria))
    .orderBy(asc(materialEstoque.id))
    .all();

  for (const item of itens) {
    if (falta === 0) break;
    const retirar = Math.min(item.saldo_disponivel, falta);
    if (retirar === 0) continue;
    db.update(materialEstoque)
      .set({ saldo_disponivel: item.saldo_disponivel - retirar })
      .where(eq(materialEstoque.id, item.id))
      .run();
    falta -= retirar;
  }

  if (falta > 0) {
    // Não deveria acontecer: quem chama confere o saldo antes, dentro da mesma transação.
    throw new Error(`Saldo insuficiente de ${categoria}.`);
  }
}
