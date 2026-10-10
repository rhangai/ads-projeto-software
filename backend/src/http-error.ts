import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Middleware final: toda resposta de erro sai no formato { erro: string }. */
export const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ erro: err.issues.map((i) => i.message).join(' ') });
    return;
  }
  // Última barreira: a CHECK constraint do SQLite barrou um saldo negativo.
  if (typeof err?.message === 'string' && err.message.includes('saldo_nao_negativo')) {
    res.status(422).json({ erro: 'O saldo não pode ficar negativo.' });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno. Tente novamente em instantes.' });
};
