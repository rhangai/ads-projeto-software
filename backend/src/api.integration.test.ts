// Testes de INTEGRAÇÃO: requisições HTTP reais ao app Express (via Supertest), passando por
// rotas, controllers, validação, Drizzle e um SQLite em memória com as migrations de verdade.
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from './app';
import { db, runMigrations } from './db/client';
import { caoFila, materialEstoque } from './db/schema';

const app = criarApp();

const cadastroValido = {
  nome_cao: 'Thor',
  nome_tutor: 'Ana Exemplo',
  telefone_tutor: '(11) 90000-0004',
  altura_cm: 35,
  comprimento_cm: 55,
};

function saldoDe(id: number): number {
  return db.select().from(materialEstoque).where(eq(materialEstoque.id, id)).get()!.saldo_disponivel;
}

beforeAll(() => {
  runMigrations();
});

// Cada teste começa com os mesmos dados: 3 cães aguardando, 10 canos e 8 rodinhas.
beforeEach(() => {
  db.delete(caoFila).run();
  db.delete(materialEstoque).run();
  db.insert(caoFila)
    .values([
      { id: 1, nome_cao: 'Rex', nome_tutor: 'João Exemplo', telefone_tutor: '(11) 90000-0001', altura_cm: 40, comprimento_cm: 60 },
      { id: 2, nome_cao: 'Luna', nome_tutor: 'Maria Exemplo', telefone_tutor: '(11) 90000-0002', altura_cm: 25, comprimento_cm: 45 },
      { id: 3, nome_cao: 'Bob', nome_tutor: 'Ana Exemplo', telefone_tutor: '(11) 90000-0003', altura_cm: 30, comprimento_cm: 50 },
    ])
    .run();
  db.insert(materialEstoque)
    .values([
      { id: 1, nome_material: 'Cano de PVC 20 mm', categoria_material: 'cano_pvc', saldo_disponivel: 10 },
      { id: 2, nome_material: 'Rodinha 50 mm', categoria_material: 'roda', saldo_disponivel: 8 },
    ])
    .run();
});

describe('GET /api/caes', () => {
  it('lista os cães na ordem de chegada', async () => {
    const res = await request(app).get('/api/caes').expect(200);
    expect(res.body.map((c: { nome_cao: string }) => c.nome_cao)).toEqual(['Rex', 'Luna', 'Bob']);
  });

  it('filtra por status', async () => {
    db.update(caoFila).set({ status: 'entregue' }).where(eq(caoFila.id, 1)).run();
    const res = await request(app).get('/api/caes?status=aguardando').expect(200);
    expect(res.body.map((c: { id: number }) => c.id)).toEqual([2, 3]);
  });

  it('recusa status desconhecido', async () => {
    await request(app).get('/api/caes?status=sumido').expect(400);
  });
});

describe('POST /api/caes', () => {
  it('cadastra na fila como "aguardando"', async () => {
    const res = await request(app).post('/api/caes').send(cadastroValido).expect(201);
    expect(res.body).toMatchObject({ ...cadastroValido, status: 'aguardando' });
    expect(db.select().from(caoFila).all()).toHaveLength(4);
  });

  it('remove espaços nas pontas dos textos', async () => {
    const res = await request(app)
      .post('/api/caes')
      .send({ ...cadastroValido, nome_cao: '  Thor  ' })
      .expect(201);
    expect(res.body.nome_cao).toBe('Thor');
  });

  it.each([
    ['nome vazio', { nome_cao: '   ' }, 'Informe o nome do cão.'],
    ['nome com mais de 60 caracteres', { nome_cao: 'A'.repeat(61) }, 'até 60 caracteres'],
    ['nome com quebra de linha', { nome_cao: 'Th\nor' }, 'caracteres inválidos'],
    ['telefone com letras', { telefone_tutor: '<script>alert(1)</script>' }, 'só pode ter números'],
    ['telefone sem DDD', { telefone_tutor: '90000-0004' }, 'com DDD'],
    ['altura como texto', { altura_cm: '40' }, 'A altura deve ser um número.'],
    ['altura fracionada', { altura_cm: 40.5 }, 'cm inteiros'],
    ['altura abaixo do mínimo', { altura_cm: 4 }, 'Altura mínima: 5 cm.'],
    ['comprimento acima do máximo', { comprimento_cm: 201 }, 'Comprimento máximo: 200 cm.'],
    ['campo extra', { status: 'entregue' }, 'Campo não esperado'],
  ])('recusa %s com 400', async (_caso, mudanca, mensagem) => {
    const res = await request(app)
      .post('/api/caes')
      .send({ ...cadastroValido, ...mudanca })
      .expect(400);
    expect(res.body.erro).toContain(mensagem);
    expect(db.select().from(caoFila).all()).toHaveLength(3);
  });

  it('recusa campo obrigatório ausente', async () => {
    const { telefone_tutor: _, ...semTelefone } = cadastroValido;
    const res = await request(app).post('/api/caes').send(semTelefone).expect(400);
    expect(res.body.erro).toContain('Informe o telefone do tutor.');
  });

  it('responde 400 (e não 500) para JSON malformado', async () => {
    const res = await request(app)
      .post('/api/caes')
      .set('content-type', 'application/json')
      .send('{"nome_cao":')
      .expect(400);
    expect(res.body.erro).toBe('O corpo da requisição não é um JSON válido.');
  });

  it('responde 413 para corpo acima de 10 KB', async () => {
    const res = await request(app)
      .post('/api/caes')
      .send({ ...cadastroValido, nome_cao: 'A'.repeat(20_000) })
      .expect(413);
    expect(res.body.erro).toBe('A requisição é grande demais.');
  });
});

describe('POST /api/caes/:id/aprovar', () => {
  it('muda para "em_montagem" e debita canos e rodinhas', async () => {
    const res = await request(app).post('/api/caes/1/aprovar').expect(200);
    expect(res.body.status).toBe('em_montagem');
    // Rex 40 x 60 consome 3 canos e 4 rodinhas
    expect(saldoDe(1)).toBe(7);
    expect(saldoDe(2)).toBe(4);
  });

  it('não aprova duas vezes o mesmo cão', async () => {
    await request(app).post('/api/caes/1/aprovar').expect(200);
    const res = await request(app).post('/api/caes/1/aprovar').expect(409);
    expect(res.body.erro).toBe('Rex não está aguardando montagem.');
    expect(saldoDe(1)).toBe(7);
  });

  it('recusa quando falta material e não debita nada', async () => {
    db.update(materialEstoque).set({ saldo_disponivel: 2 }).where(eq(materialEstoque.id, 1)).run();
    const res = await request(app).post('/api/caes/1/aprovar').expect(409);
    expect(res.body.erro).toBe('Saldo insuficiente para montar a cadeira de Rex.');
    expect(saldoDe(1)).toBe(2);
    expect(saldoDe(2)).toBe(8);
    expect(db.select().from(caoFila).where(eq(caoFila.id, 1)).get()!.status).toBe('aguardando');
  });

  it('debita de mais de um item da mesma categoria, na ordem de cadastro', async () => {
    db.update(materialEstoque).set({ saldo_disponivel: 1 }).where(eq(materialEstoque.id, 1)).run();
    db.insert(materialEstoque)
      .values({ id: 3, nome_material: 'Cano de PVC doado', categoria_material: 'cano_pvc', saldo_disponivel: 5 })
      .run();
    await request(app).post('/api/caes/1/aprovar').expect(200);
    expect(saldoDe(1)).toBe(0);
    expect(saldoDe(3)).toBe(3);
  });

  it('responde 404 para cão inexistente e 400 para id inválido', async () => {
    await request(app).post('/api/caes/999/aprovar').expect(404);
    await request(app).post('/api/caes/abc/aprovar').expect(400);
  });
});

describe('GET /api/estoque', () => {
  it('lista os materiais', async () => {
    const res = await request(app).get('/api/estoque').expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ categoria_material: 'cano_pvc', saldo_disponivel: 10 });
  });
});

describe('PATCH /api/estoque/:id', () => {
  it('soma entradas e subtrai saídas', async () => {
    await request(app).patch('/api/estoque/1').send({ delta: 5 }).expect(200);
    const res = await request(app).patch('/api/estoque/1').send({ delta: -3 }).expect(200);
    expect(res.body.saldo_disponivel).toBe(12);
  });

  it('pode zerar o saldo, mas não deixar negativo', async () => {
    await request(app).patch('/api/estoque/2').send({ delta: -8 }).expect(200);
    const res = await request(app).patch('/api/estoque/2').send({ delta: -1 }).expect(422);
    expect(res.body.erro).toBe('O saldo não pode ficar negativo.');
    expect(saldoDe(2)).toBe(0);
  });

  it.each([
    ['delta zero', { delta: 0 }, 'não pode ser zero'],
    ['delta fracionado', { delta: 1.5 }, 'número inteiro'],
    ['delta como texto', { delta: '5' }, 'como número'],
    ['sem delta', {}, 'Informe a variação'],
  ])('recusa %s com 400', async (_caso, corpo, mensagem) => {
    const res = await request(app).patch('/api/estoque/1').send(corpo).expect(400);
    expect(res.body.erro).toContain(mensagem);
  });

  it('responde 404 para material inexistente', async () => {
    await request(app).patch('/api/estoque/99').send({ delta: 1 }).expect(404);
  });

  it('não perde ajustes simultâneos (20 requisições +1 em paralelo)', async () => {
    await Promise.all(Array.from({ length: 20 }, () => request(app).patch('/api/estoque/1').send({ delta: 1 })));
    expect(saldoDe(1)).toBe(30);
  });

  it('a rota antiga PUT não existe mais', async () => {
    await request(app).put('/api/estoque/1').send({ saldo_disponivel: 3 }).expect(404);
  });
});

describe('GET /api/compatibilidade', () => {
  it('lista os aptos com o consumo e não altera o banco', async () => {
    const res = await request(app).get('/api/compatibilidade').expect(200);
    expect(res.body.aptos.map((c: { nome_cao: string }) => c.nome_cao)).toEqual(['Rex', 'Luna']);
    expect(res.body.aptos[0].consumo).toEqual({ canos_pvc: 3, rodas: 4 });
    expect(res.body.saldo_atual).toEqual({ canos_pvc: 10, rodas: 8 });
    expect(res.body.saldo_apos_aptos).toEqual({ canos_pvc: 5, rodas: 0 });
    expect(saldoDe(1)).toBe(10);
    expect(saldoDe(2)).toBe(8);
  });

  it('ignora cães que não estão aguardando', async () => {
    await request(app).post('/api/caes/1/aprovar').expect(200);
    const res = await request(app).get('/api/compatibilidade').expect(200);
    // Sobraram 7 canos e 4 rodinhas: só cabe mais um (Luna).
    expect(res.body.aptos.map((c: { id: number }) => c.id)).toEqual([2]);
  });
});

describe('infraestrutura HTTP', () => {
  it('responde 404 em JSON para rota desconhecida', async () => {
    const res = await request(app).get('/api/nao-existe').expect(404);
    expect(res.body).toEqual({ erro: 'Rota não encontrada.' });
  });

  it('envia cabeçalhos de segurança e esconde o X-Powered-By', async () => {
    const res = await request(app).get('/api/estoque').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('libera CORS só para o front local', async () => {
    const res = await request(app).get('/api/estoque').set('Origin', 'http://localhost:4200').expect(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
  });
});
