// Regra de consumo do modo demonstração: cópia de backend/src/models/compatibilidade.ts.
// Módulo puro (sem Angular) de propósito: o teste backend/src/models/compatibilidade.test.ts
// importa este arquivo e falha se as duas cópias derem resultados diferentes.

export interface Consumo {
  canos_pvc: number;
  rodas: number;
}

interface Medidas {
  altura_cm: number;
  comprimento_cm: number;
}

export function calcularConsumo(alturaCm: number, comprimentoCm: number): Consumo {
  return { canos_pvc: Math.ceil((2 * comprimentoCm + 4 * alturaCm) / 100), rodas: 4 };
}

/** Percorre a fila na ordem e reserva o material em memória; quem não cabe é pulado. */
export function cruzarCompatibilidade<T extends Medidas>(fila: T[], saldo: Consumo) {
  const restante: Consumo = { ...saldo };
  const aptos: (T & { consumo: Consumo })[] = [];
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
