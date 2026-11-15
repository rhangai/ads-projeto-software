// Testes UNITÁRIOS do repositório de estoque, contra o SQLite em memória.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, runMigrations } from '../db/client';
import { materialEstoque } from '../db/schema';
import { debitarCategoria, saldoParaCadeiras, saldoPorCategoria } from './estoque.repository';

beforeAll(() => runMigrations());

beforeEach(() => {
  db.delete(materialEstoque).run();
  db.insert(materialEstoque)
    .values([
      { id: 1, nome_material: 'Cano A', categoria_material: 'cano_pvc', saldo_disponivel: 2 },
      { id: 2, nome_material: 'Cano B', categoria_material: 'cano_pvc', saldo_disponivel: 5 },
      { id: 3, nome_material: 'Rodinha', categoria_material: 'roda', saldo_disponivel: 4 },
    ])
    .run();
});

describe('saldoPorCategoria', () => {
  it('soma todos os itens da categoria', () => {
    expect(saldoPorCategoria(db, 'cano_pvc')).toBe(7);
    expect(saldoParaCadeiras(db)).toEqual({ canos_pvc: 7, rodas: 4 });
  });

  it('dá zero para categoria sem itens', () => {
    expect(saldoPorCategoria(db, 'conector')).toBe(0);
  });
});

describe('debitarCategoria', () => {
  it('esgota o primeiro item antes de passar ao próximo', () => {
    debitarCategoria(db, 'cano_pvc', 4);
    const saldos = db.select().from(materialEstoque).all().map((m) => m.saldo_disponivel);
    expect(saldos).toEqual([0, 3, 4]);
  });

  it('falha se a categoria não tiver o suficiente (proteção caso o chamador não confira antes)', () => {
    expect(() => debitarCategoria(db, 'roda', 5)).toThrow('Saldo insuficiente de roda.');
  });
});
