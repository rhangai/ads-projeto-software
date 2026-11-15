// Testes UNITÁRIOS do middleware de erros, isolado do Express.
import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { HttpError, tratarErros } from './http-error';

function respostaFalsa() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function tratar(err: unknown) {
  const res = respostaFalsa();
  tratarErros(err, {} as Request, res as unknown as Response, (() => {}) as NextFunction);
  return { status: res.status.mock.calls[0]?.[0], corpo: res.json.mock.calls[0]?.[0] };
}

afterEach(() => vi.restoreAllMocks());

describe('tratarErros', () => {
  it('usa status e mensagem do HttpError', () => {
    expect(tratar(new HttpError(409, 'Conflito.'))).toEqual({ status: 409, corpo: { erro: 'Conflito.' } });
  });

  it('junta as mensagens do zod em um 400', () => {
    const r = z.object({ a: z.string({ required_error: 'A?' }), b: z.number({ required_error: 'B?' }) }).safeParse({});
    expect(tratar(r.error)).toEqual({ status: 400, corpo: { erro: 'A? B?' } });
  });

  it('traduz erros de corpo do express.json', () => {
    expect(tratar({ type: 'entity.parse.failed' }).status).toBe(400);
    expect(tratar({ type: 'entity.too.large' }).status).toBe(413);
  });

  it('transforma a violação do CHECK de saldo do SQLite em 422', () => {
    const erro = new Error('CHECK constraint failed: saldo_nao_negativo');
    expect(tratar(erro)).toEqual({ status: 422, corpo: { erro: 'O saldo não pode ficar negativo.' } });
  });

  it('esconde o detalhe de erros inesperados e registra no log', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const erro = new Error('senha do banco: 123');
    const r = tratar(erro);
    expect(r).toEqual({ status: 500, corpo: { erro: 'Erro interno. Tente novamente em instantes.' } });
    expect(JSON.stringify(r.corpo)).not.toContain('senha');
    expect(log).toHaveBeenCalledWith(erro);
  });
});
