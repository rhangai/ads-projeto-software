// CONTROLLER — estoque físico de materiais.
import { and, asc, eq, gte, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { materialEstoque } from '../db/schema';
import { HttpError } from '../http-error';

const idSchema = z.coerce.number().int().positive('Id inválido.');

const ajusteSchema = z.object({
  delta: z
    .number({ invalid_type_error: 'Informe a variação como número.', required_error: 'Informe a variação (delta).' })
    .int('A variação deve ser um número inteiro.')
    .refine((d) => d !== 0, 'A variação não pode ser zero.'),
});

/** GET /api/estoque */
export function listar(_req: Request, res: Response): void {
  res.json(db.select().from(materialEstoque).orderBy(asc(materialEstoque.id)).all());
}

/**
 * PATCH /api/estoque/:id  body: { delta: number }
 *
 * Recebe a VARIAÇÃO (ex.: +5 chegaram, -2 quebraram), não o saldo final. Assim, dois
 * voluntários ajustando ao mesmo tempo somam os dois ajustes em vez de um sobrescrever o outro.
 * A soma e a checagem de saldo negativo acontecem numa única instrução SQL (atômica).
 */
export function ajustar(req: Request, res: Response): void {
  const id = idSchema.parse(req.params.id);
  const { delta } = ajusteSchema.parse(req.body);

  const atualizado = db
    .update(materialEstoque)
    .set({ saldo_disponivel: sql`${materialEstoque.saldo_disponivel} + ${delta}` })
    .where(and(eq(materialEstoque.id, id), gte(sql`${materialEstoque.saldo_disponivel} + ${delta}`, 0)))
    .returning()
    .get();

  if (atualizado) {
    res.json(atualizado);
    return;
  }

  // Nenhuma linha alterada: ou o material não existe, ou o saldo ficaria negativo.
  const existe = db.select({ id: materialEstoque.id }).from(materialEstoque).where(eq(materialEstoque.id, id)).get();
  if (!existe) throw new HttpError(404, 'Material não encontrado.');
  throw new HttpError(422, 'O saldo não pode ficar negativo.');
}
