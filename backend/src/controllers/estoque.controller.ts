// CONTROLLER — estoque físico de materiais.
import { asc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { materialEstoque } from '../db/schema';
import { HttpError } from '../http-error';

const idSchema = z.coerce.number().int().positive('Id inválido.');

const ajusteSchema = z.object({
  saldo_disponivel: z.number({ invalid_type_error: 'Informe o saldo como número.' }).int('O saldo deve ser um número inteiro.'),
});

/** GET /api/estoque */
export function listar(_req: Request, res: Response): void {
  res.json(db.select().from(materialEstoque).orderBy(asc(materialEstoque.id)).all());
}

/** PUT /api/estoque/:id  body: { saldo_disponivel: number } */
export function atualizar(req: Request, res: Response): void {
  const id = idSchema.parse(req.params.id);
  const { saldo_disponivel } = ajusteSchema.parse(req.body);

  // Regra de negócio: bloqueia antes de chegar ao banco (que também tem CHECK).
  if (saldo_disponivel < 0) {
    throw new HttpError(422, 'O saldo não pode ficar negativo.');
  }

  const atualizado = db
    .update(materialEstoque)
    .set({ saldo_disponivel })
    .where(eq(materialEstoque.id, id))
    .returning()
    .get();

  if (!atualizado) throw new HttpError(404, 'Material não encontrado.');
  res.json(atualizado);
}
