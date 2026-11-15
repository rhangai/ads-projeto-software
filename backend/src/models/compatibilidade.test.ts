import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as mock from '../../../frontend/src/app/mock/regra-consumo';
import type { CaoFila } from '../db/schema';
import { calcularConsumo, cruzarCompatibilidade } from './compatibilidade';

function cao(id: number, altura_cm: number, comprimento_cm: number): CaoFila {
  return {
    id,
    nome_cao: `Cão ${id}`,
    nome_tutor: 'Tutor Exemplo',
    telefone_tutor: '(11) 90000-0000',
    altura_cm,
    comprimento_cm,
    status: 'aguardando',
  };
}

/** Gerador determinístico: os mesmos casos em toda execução. */
function aleatorio(semente: number) {
  let s = semente;
  return (min: number, max: number) => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return min + (s % (max - min + 1));
  };
}

describe('calcularConsumo', () => {
  it('usa barras de 1 m arredondando para cima e 4 rodinhas', () => {
    // Rex, 40 x 60: (2*60 + 4*40) / 100 = 2,8 -> 3 canos
    assert.deepEqual(calcularConsumo(40, 60), { canos_pvc: 3, rodas: 4 });
    // Luna, 25 x 45: (90 + 100) / 100 = 1,9 -> 2 canos
    assert.deepEqual(calcularConsumo(25, 45), { canos_pvc: 2, rodas: 4 });
    // Exatamente 2 m não arredonda para 3
    assert.deepEqual(calcularConsumo(25, 50), { canos_pvc: 2, rodas: 4 });
  });
});

describe('cruzarCompatibilidade', () => {
  it('reserva o material na ordem da fila e não declara dois cães com as mesmas peças', () => {
    const r = cruzarCompatibilidade([cao(1, 40, 60), cao(2, 25, 45), cao(3, 30, 50)], { canos_pvc: 10, rodas: 8 });
    assert.deepEqual(r.aptos.map((c) => c.id), [1, 2]); // rodinhas acabam no 3º
    assert.deepEqual(r.saldo_apos_aptos, { canos_pvc: 5, rodas: 0 });
  });

  it('pula quem não cabe e ainda avalia o próximo, que pode ser menor', () => {
    const r = cruzarCompatibilidade([cao(1, 80, 120), cao(2, 25, 45)], { canos_pvc: 3, rodas: 4 });
    assert.deepEqual(r.aptos.map((c) => c.id), [2]);
  });

  it('não altera o saldo recebido', () => {
    const saldo = { canos_pvc: 10, rodas: 8 };
    cruzarCompatibilidade([cao(1, 40, 60)], saldo);
    assert.deepEqual(saldo, { canos_pvc: 10, rodas: 8 });
  });
});

// O modo demonstração (frontend) tem uma cópia da regra. Estes testes falham se as duas divergirem.
describe('sincronia com a regra do modo demonstração', () => {
  it('calcularConsumo dá o mesmo resultado em toda a faixa de medidas aceitas', () => {
    for (let altura = 5; altura <= 150; altura++) {
      for (let comprimento = 10; comprimento <= 200; comprimento += 7) {
        assert.deepEqual(mock.calcularConsumo(altura, comprimento), calcularConsumo(altura, comprimento), `${altura} x ${comprimento}`);
      }
    }
  });

  it('cruzarCompatibilidade dá o mesmo resultado em 300 filas sorteadas', () => {
    const sortear = aleatorio(42);
    for (let caso = 0; caso < 300; caso++) {
      const fila = Array.from({ length: sortear(0, 8) }, (_, i) => cao(i + 1, sortear(5, 150), sortear(10, 200)));
      const saldo = { canos_pvc: sortear(0, 40), rodas: sortear(0, 24) };
      assert.deepEqual(mock.cruzarCompatibilidade(fila, saldo), cruzarCompatibilidade(fila, saldo), `caso ${caso}`);
    }
  });
});
