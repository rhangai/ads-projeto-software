// MODEL — regra de negócio do cruzamento de dados (funções puras, sem acesso a banco).
import type { CaoFila } from '../db/schema';

/**
 * Regra de consumo de uma cadeira. Valores provisórios: ajuste com a equipe de
 * montagem da ONG.
 *
 * Estrutura considerada: 2 longarinas do tamanho do comprimento do cão +
 * 4 pernas do tamanho da altura. Os canos são comprados em barras inteiras.
 */
export const REGRA_CONSUMO = {
  comprimentoBarraCm: 100,
  longarinas: 2,
  pernas: 4,
  rodasPorCadeira: 4,
} as const;

export interface Consumo {
  canos_pvc: number;
  rodas: number;
}

export function calcularConsumo(alturaCm: number, comprimentoCm: number): Consumo {
  const totalCm = REGRA_CONSUMO.longarinas * comprimentoCm + REGRA_CONSUMO.pernas * alturaCm;
  return {
    canos_pvc: Math.ceil(totalCm / REGRA_CONSUMO.comprimentoBarraCm),
    rodas: REGRA_CONSUMO.rodasPorCadeira,
  };
}

export interface CaoApto extends CaoFila {
  consumo: Consumo;
}

export interface ResultadoCompatibilidade {
  aptos: CaoApto[];
  saldo_atual: Consumo;
  saldo_apos_aptos: Consumo;
}

/**
 * Percorre a fila na ordem de chegada e "reserva" o material em memória.
 * Assim, dois cães nunca são declarados aptos usando os mesmos canos.
 * Um cão que não cabe no saldo restante é pulado, e o próximo (talvez menor)
 * ainda pode ser atendido. Nada é gravado no banco.
 */
export function cruzarCompatibilidade(fila: CaoFila[], saldo: Consumo): ResultadoCompatibilidade {
  const restante: Consumo = { ...saldo };
  const aptos: CaoApto[] = [];

  for (const cao of fila) {
    const consumo = calcularConsumo(cao.altura_cm, cao.comprimento_cm);
    if (consumo.canos_pvc <= restante.canos_pvc && consumo.rodas <= restante.rodas) {
      aptos.push({ ...cao, consumo });
      restante.canos_pvc -= consumo.canos_pvc;
      restante.rodas -= consumo.rodas;
    }
  }

  return { aptos, saldo_atual: saldo, saldo_apos_aptos: restante };
}
