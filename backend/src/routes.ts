import { Router } from 'express';
import * as caes from './controllers/caes.controller';
import * as compatibilidade from './controllers/compatibilidade.controller';
import * as estoque from './controllers/estoque.controller';

export const router = Router();

// Fila de espera
router.get('/caes', caes.listar);
router.post('/caes', caes.criar);
router.post('/caes/:id/aprovar', caes.aprovarMontagem);

// Estoque
router.get('/estoque', estoque.listar);
router.patch('/estoque/:id', estoque.ajustar);

// Cruzamento de dados (não altera o banco)
router.get('/compatibilidade', compatibilidade.verificar);
