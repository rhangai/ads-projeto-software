// CONTROLLER — cruzamento de dados (fila x estoque). Somente leitura.
import { asc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '../db/client';
import { caoFila } from '../db/schema';
import { cruzarCompatibilidade } from '../models/compatibilidade';
import { saldoParaCadeiras } from '../models/estoque.repository';

/** GET /api/compatibilidade — lista os cães aptos SEM abater do estoque. */
export function verificar(_req: Request, res: Response): void {
  const fila = db
    .select()
    .from(caoFila)
    .where(eq(caoFila.status, 'aguardando'))
    .orderBy(asc(caoFila.id))
    .all();

  res.json(cruzarCompatibilidade(fila, saldoParaCadeiras(db)));
}
