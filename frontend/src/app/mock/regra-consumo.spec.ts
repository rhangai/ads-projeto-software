import { calcularConsumo, cruzarCompatibilidade } from './regra-consumo';

// A sincronia com a regra da API é testada no backend (compatibilidade.test.ts);
// aqui ficam só os casos de referência da própria cópia.
describe('regra de consumo do modo demonstração', () => {
  it('calcula canos por barra de 1 m, arredondando para cima', () => {
    expect(calcularConsumo(40, 60)).toEqual({ canos_pvc: 3, rodas: 4 });
    expect(calcularConsumo(25, 50)).toEqual({ canos_pvc: 2, rodas: 4 });
  });

  it('pula quem não cabe e reserva o material dos aptos', () => {
    const fila = [
      { id: 1, altura_cm: 80, comprimento_cm: 120 },
      { id: 2, altura_cm: 25, comprimento_cm: 45 },
    ];
    const r = cruzarCompatibilidade(fila, { canos_pvc: 3, rodas: 4 });
    expect(r.aptos.map((c) => c.id)).toEqual([2]);
    expect(r.saldo_apos_aptos).toEqual({ canos_pvc: 1, rodas: 0 });
  });
});
