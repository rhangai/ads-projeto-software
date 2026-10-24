# Cão Saci — MVP

Gestão da fila de cães que aguardam cadeira de rodas de PVC, do estoque de peças e da triagem
(quem da fila já pode receber a cadeira com o material disponível).

| Camada | Tecnologia | Onde |
| --- | --- | --- |
| Model | SQLite + Drizzle ORM | `backend/src/db/schema.ts`, `backend/src/models/` |
| Controller | Node.js + Express 5 | `backend/src/controllers/`, `backend/src/routes.ts` |
| View | Angular 18 (standalone + signals) + Tailwind 3 | `frontend/src/app/` |

## Como rodar

Monorepo pnpm com dois pacotes: `backend` (`cao-saci-api`) e `frontend` (`cao-saci-web`).
Requer Node 20+ e pnpm 11.

```bash
pnpm install
pnpm dev
```

O `pnpm dev` cria o banco `backend/cao-saci.db` com dados de exemplo (só se estiver vazio) e sobe
a API (porta 3000) e o front (porta 4200, com proxy `/api` → `localhost:3000`) juntos.

Abra http://localhost:4200. No desktop o app aparece como uma coluna de celular; use o modo
dispositivo do DevTools para ver em tela cheia.

| Comando na raiz | O que faz |
| --- | --- |
| `pnpm dev` | Seed + API + front em modo desenvolvimento |
| `pnpm build` | Build de produção do front |
| `pnpm typecheck` | Checa os tipos dos dois pacotes |
| `pnpm db:generate` | Gera migration depois de mudar o `schema.ts` (aplicada ao subir a API) |
| `pnpm db:seed` | Insere os dados de exemplo |

Para rodar um pacote só: `pnpm --filter cao-saci-api dev` ou `pnpm --filter cao-saci-web dev`.
Para recomeçar o banco do zero, apague `backend/cao-saci.db*`.

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
