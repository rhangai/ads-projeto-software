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

/** Erros que o express.json() levanta antes de chegar aos controllers. */
const ERROS_DO_CORPO: Record<string, { status: number; erro: string }> = {
  'entity.parse.failed': { status: 400, erro: 'O corpo da requisição não é um JSON válido.' },
  'entity.too.large': { status: 413, erro: 'A requisição é grande demais.' },
};

/**
 * Middleware final: toda resposta de erro sai no formato { erro: string }.
 * Erros do cliente viram 4xx com mensagem clara; só o que é inesperado vira 500,
 * e nesse caso o detalhe vai para o log do servidor, nunca para a resposta.
 */
export const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ erro: err.issues.map((i) => i.message).join(' ') });
    return;
  }
  const doCorpo = typeof err?.type === 'string' ? ERROS_DO_CORPO[err.type] : undefined;
  if (doCorpo) {
    res.status(doCorpo.status).json({ erro: doCorpo.erro });
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
