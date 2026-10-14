// Dados de exemplo (fictícios) para desenvolvimento. Só insere se as tabelas estiverem vazias.
import { db, runMigrations } from './client';
import { caoFila, materialEstoque } from './schema';

runMigrations();

if (db.select().from(caoFila).all().length === 0) {
  db.insert(caoFila)
    .values([
      { nome_cao: 'Rex', nome_tutor: 'João Exemplo', telefone_tutor: '(11) 90000-0001', altura_cm: 40, comprimento_cm: 60 },
      { nome_cao: 'Luna', nome_tutor: 'Maria Exemplo', telefone_tutor: '(11) 90000-0002', altura_cm: 25, comprimento_cm: 45 },
      { nome_cao: 'Bob', nome_tutor: 'Ana Exemplo', telefone_tutor: '(11) 90000-0003', altura_cm: 30, comprimento_cm: 50 },
    ])
    .run();
  console.log('Cães de exemplo inseridos.');
}

if (db.select().from(materialEstoque).all().length === 0) {
  db.insert(materialEstoque)
    .values([
      { nome_material: 'Cano de PVC 20 mm (barra de 1 m)', categoria_material: 'cano_pvc', saldo_disponivel: 10 },
      { nome_material: 'Rodinha de silicone 50 mm', categoria_material: 'roda', saldo_disponivel: 8 },
    ])
    .run();
  console.log('Materiais de exemplo inseridos.');
}
