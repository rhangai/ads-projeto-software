// CONTROLLER — fila de espera dos cães.
import { asc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { caoFila, STATUS_CAO } from '../db/schema';
import { HttpError } from '../http-error';
import { calcularConsumo } from '../models/compatibilidade';
import { debitarCategoria, saldoParaCadeiras } from '../models/estoque.repository';

// Limites e formatos: mantenha iguais aos do formulário (novo-cao.component.ts) e do mock.
export const LIMITES = { nome: 60, telefone: 20 } as const;

/** Nome: tamanho limitado e sem caracteres de controle (quebras de linha, NUL etc.). */
const nome = (rotulo: string) =>
  z
    .string({ required_error: `Informe o nome do ${rotulo}.`, invalid_type_error: `O nome do ${rotulo} deve ser texto.` })
    .trim()
    .min(1, `Informe o nome do ${rotulo}.`)
    .max(LIMITES.nome, `O nome do ${rotulo} pode ter até ${LIMITES.nome} caracteres.`)
    // eslint-disable-next-line no-control-regex
    .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), `O nome do ${rotulo} tem caracteres inválidos.`);

const novoCaoSchema = z
  .object({
    nome_cao: nome('cão'),
    nome_tutor: nome('tutor'),
    telefone_tutor: z
      .string({ required_error: 'Informe o telefone do tutor.', invalid_type_error: 'O telefone deve ser texto.' })
      .trim()
      .max(LIMITES.telefone, 'Telefone longo demais.')
      // Só dígitos e a pontuação usual de telefone; entre 10 e 13 dígitos (DDD + número, com ou sem +55).
      .refine((v) => /^[0-9()+\-.\s]+$/.test(v), 'O telefone só pode ter números, espaços, parênteses, + e -.')
      .refine((v) => {
        const digitos = v.replace(/\D/g, '').length;
        return digitos >= 10 && digitos <= 13;
      }, 'Informe o telefone com DDD.'),
    // z.number() estrito (sem coerce): "40", true ou [40] são recusados em vez de convertidos.
    altura_cm: z
      .number({ required_error: 'Informe a altura em cm.', invalid_type_error: 'A altura deve ser um número.' })
      .int('A altura deve ser em cm inteiros.')
      .min(5, 'Altura mínima: 5 cm.')
      .max(150, 'Altura máxima: 150 cm.'),
    comprimento_cm: z
      .number({ required_error: 'Informe o comprimento em cm.', invalid_type_error: 'O comprimento deve ser um número.' })
      .int('O comprimento deve ser em cm inteiros.')
      .min(10, 'Comprimento mínimo: 10 cm.')
      .max(200, 'Comprimento máximo: 200 cm.'),
  })
  // Campos a mais (ex.: "status": "entregue") são recusados, não ignorados em silêncio.
  .strict('Campo não esperado no cadastro.');

const idSchema = z.coerce.number().int().positive('Id inválido.');
const statusSchema = z.enum(STATUS_CAO).optional();

/** GET /api/caes?status=aguardando */
export function listar(req: Request, res: Response): void {
  const status = statusSchema.parse(req.query.status);
  const query = db.select().from(caoFila).orderBy(asc(caoFila.id));
  const caes = status ? query.where(eq(caoFila.status, status)).all() : query.all();
  res.json(caes);
}

/** POST /api/caes */
export function criar(req: Request, res: Response): void {
  const dados = novoCaoSchema.parse(req.body);
  const criado = db
    .insert(caoFila)
    .values({ ...dados, status: 'aguardando' })
    .returning()
    .get();
  res.status(201).json(criado);
}

/**
 * POST /api/caes/:id/aprovar
 * Aprova a montagem: confere o saldo, debita o material e muda o status para
 * "em_montagem", tudo numa única transação.
 */
export function aprovarMontagem(req: Request, res: Response): void {
  const id = idSchema.parse(req.params.id);

  const atualizado = db.transaction((tx) => {
    const cao = tx.select().from(caoFila).where(eq(caoFila.id, id)).get();
    if (!cao) throw new HttpError(404, 'Cão não encontrado.');
    if (cao.status !== 'aguardando') {
      throw new HttpError(409, `${cao.nome_cao} não está aguardando montagem.`);
    }

    const consumo = calcularConsumo(cao.altura_cm, cao.comprimento_cm);
    const saldo = saldoParaCadeiras(tx);
    if (consumo.canos_pvc > saldo.canos_pvc || consumo.rodas > saldo.rodas) {
      throw new HttpError(409, `Saldo insuficiente para montar a cadeira de ${cao.nome_cao}.`);
    }

    debitarCategoria(tx, 'cano_pvc', consumo.canos_pvc);
    debitarCategoria(tx, 'roda', consumo.rodas);

    return tx
      .update(caoFila)
      .set({ status: 'em_montagem' })
      .where(eq(caoFila.id, id))
      .returning()
      .get();
  });

  res.json(atualizado);
}
