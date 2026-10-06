// MODEL — estrutura das tabelas (Drizzle ORM + SQLite).
// Os nomes das propriedades seguem o snake_case das colunas para que a API
// devolva exatamente os mesmos campos que existem no banco.
import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const STATUS_CAO = ['aguardando', 'em_montagem', 'entregue'] as const;
export type StatusCao = (typeof STATUS_CAO)[number];

export const CATEGORIAS_MATERIAL = ['cano_pvc', 'roda', 'conector', 'outro'] as const;
export type CategoriaMaterial = (typeof CATEGORIAS_MATERIAL)[number];

export const caoFila = sqliteTable(
  'cao_fila',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nome_cao: text('nome_cao').notNull(),
    nome_tutor: text('nome_tutor').notNull(),
    telefone_tutor: text('telefone_tutor').notNull(),
    altura_cm: integer('altura_cm').notNull(),
    comprimento_cm: integer('comprimento_cm').notNull(),
    status: text('status', { enum: STATUS_CAO }).notNull().default('aguardando'),
  },
  (t) => [
    check('cao_status_valido', sql`${t.status} IN ('aguardando', 'em_montagem', 'entregue')`),
    check('cao_medidas_positivas', sql`${t.altura_cm} > 0 AND ${t.comprimento_cm} > 0`),
  ],
);

export const materialEstoque = sqliteTable(
  'material_estoque',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nome_material: text('nome_material').notNull(),
    categoria_material: text('categoria_material', { enum: CATEGORIAS_MATERIAL }).notNull(),
    saldo_disponivel: integer('saldo_disponivel').notNull().default(0),
  },
  (t) => [
    // Regra de negócio garantida também pelo banco: saldo nunca fica negativo.
    check('saldo_nao_negativo', sql`${t.saldo_disponivel} >= 0`),
  ],
);

export type CaoFila = typeof caoFila.$inferSelect;
export type NovoCao = typeof caoFila.$inferInsert;
export type MaterialEstoque = typeof materialEstoque.$inferSelect;
