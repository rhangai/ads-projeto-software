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
pnpm run setup   # instala dependências, cria o banco e insere dados de exemplo
pnpm dev         # sobe API (porta 3000) e front (porta 4200) juntos
```

Use `pnpm run setup`, e não `pnpm setup`: este último é um comando nativo do pnpm (configura o
`PNPM_HOME`) e ignora o script. O setup pode ser rodado de novo sem problema: só aplica migrations
pendentes e só insere os dados de exemplo se o banco estiver vazio.

O front usa proxy `/api` → `localhost:3000`.

Abra http://localhost:4200. No desktop o app aparece como uma coluna de celular; use o modo
dispositivo do DevTools para ver em tela cheia.

| Comando na raiz | O que faz |
| --- | --- |
| `pnpm run setup` | `pnpm install` + `db:setup` |
| `pnpm dev` | API + front em modo desenvolvimento |
| `pnpm dev:mock` | Só o front, com API falsa no navegador (sem backend nem banco) |
| `pnpm build:mock` | Site estático da demonstração em `frontend/dist/cao-saci-web/browser` |
| `pnpm build` | Build de produção do front |
| `pnpm typecheck` | Checa os tipos dos dois pacotes |
| `pnpm db:setup` | `db:migrate` + `db:seed` |
| `pnpm db:migrate` | Cria o banco se não existir e aplica as migrations pendentes |
| `pnpm db:seed` | Insere os dados de exemplo (só com o banco vazio) |
| `pnpm db:reset` | **Apaga o banco** e roda o `db:setup` de novo |
| `pnpm db:generate` | Gera migration depois de mudar o `schema.ts` |

Para rodar um pacote só: `pnpm --filter cao-saci-api dev` ou `pnpm --filter cao-saci-web dev`.
O banco fica em `backend/cao-saci.db` (mude com a variável `DB_FILE`).

## Modo demonstração (sem backend)

`pnpm dev:mock` liga o interceptor `frontend/src/app/mock/mock-api.interceptor.ts`, que responde
todas as chamadas `/api` no próprio navegador, com as mesmas regras e mensagens de erro da API.
Os dados ficam no `localStorage` (chave `cao-saci:mock:v1`) e o botão "Restaurar dados de
exemplo", na faixa amarela do topo, recomeça do zero.

A regra de consumo está copiada no interceptor: se mudar em
`backend/src/models/compatibilidade.ts`, mude lá também.

Para publicar o `build:mock` (GitHub Pages, Netlify, Vercel…), configure o host para devolver o
`index.html` em qualquer rota (fallback de SPA). Sem isso, recarregar em `/estoque` dá 404.

## API

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/caes?status=aguardando` | Lista os cães (filtro opcional por status) |
| POST | `/api/caes` | Cadastra um cão na fila (status `aguardando`) |
| POST | `/api/caes/:id/aprovar` | Aprova a montagem: debita o material e muda para `em_montagem` |
| GET | `/api/estoque` | Lista os materiais |
| PATCH | `/api/estoque/:id` | Soma uma variação ao saldo `{ "delta": 5 }` ou `{ "delta": -2 }`. Se ficaria negativo → 422 |
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
2. API: `PATCH /api/estoque/:id` responde 422 "O saldo não pode ficar negativo." A soma e a
   checagem acontecem numa única instrução SQL, então ajustes simultâneos não se sobrescrevem.
3. Banco: `CHECK (saldo_disponivel >= 0)` na tabela `material_estoque`.
