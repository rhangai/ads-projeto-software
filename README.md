# Cão Saci — MVP

Gestão da fila de cães que aguardam cadeira de rodas de PVC, do estoque de peças e da triagem
(quem da fila já pode receber a cadeira com o material disponível).

| Camada | Tecnologia | Onde |
| --- | --- | --- |
| Model | SQLite + Drizzle ORM | `backend/src/db/schema.ts`, `backend/src/models/` |
| Controller | Node.js + Express 5 | `backend/src/controllers/`, `backend/src/routes.ts` |
| View | Angular 18 (standalone + signals) + Tailwind 3 | `frontend/src/app/` |

## Como rodar

Requer Node 20+.

```bash
# 1. API (porta 3000)
cd backend
npm install
npm run db:seed      # cria o banco cao-saci.db, aplica a migration e insere dados de exemplo
npm run dev

# 2. Front (porta 4200, com proxy /api -> localhost:3000)
cd frontend
npm install
npm start
```

Abra http://localhost:4200. No desktop o app aparece como uma coluna de celular; use o modo
dispositivo do DevTools para ver em tela cheia.

Mudou o `schema.ts`? Rode `npm run db:generate` no `backend/` para gerar a nova migration.
Ela é aplicada automaticamente quando a API sobe.

## API

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/caes?status=aguardando` | Lista os cães (filtro opcional por status) |
| POST | `/api/caes` | Cadastra um cão na fila (status `aguardando`) |
| POST | `/api/caes/:id/aprovar` | Aprova a montagem: debita o material e muda para `em_montagem` |
| GET | `/api/estoque` | Lista os materiais |
| PUT | `/api/estoque/:id` | Define o saldo `{ "saldo_disponivel": 12 }`. Negativo → 422 |
| GET | `/api/compatibilidade` | Cruza fila × estoque e devolve os cães aptos. Não altera o banco |

Erros sempre voltam como `{ "erro": "mensagem" }`.

## Regra de consumo (provisória)

Em `backend/src/models/compatibilidade.ts`:

- canos = arredondar para cima `(2 × comprimento + 4 × altura) / 100` (barras de 1 m);
- rodinhas = 4 por cadeira.

Exemplo: Rex, 40 cm × 60 cm → (120 + 160) / 100 = 2,8 → **3 canos** e 4 rodinhas.

O cruzamento segue a ordem de chegada e reserva o material em memória: dois cães nunca são
declarados aptos com as mesmas peças. Quem não cabe é pulado e o próximo ainda é avaliado.
Os valores precisam ser validados com a equipe de montagem.

## Saldo nunca negativo — três barreiras

1. Front: os botões "−" e o campo de quantidade bloqueiam e mostram o alerta.
2. API: `PUT /api/estoque/:id` responde 422 "O saldo não pode ficar negativo."
3. Banco: `CHECK (saldo_disponivel >= 0)` na tabela `material_estoque`.
