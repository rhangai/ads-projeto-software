import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'fila' },
  {
    path: 'fila',
    title: 'Fila de espera · Cão Saci',
    loadComponent: () => import('./pages/fila/fila.component').then((m) => m.FilaComponent),
  },
  {
    path: 'fila/novo',
    title: 'Novo cadastro · Cão Saci',
    loadComponent: () => import('./pages/novo-cao/novo-cao.component').then((m) => m.NovoCaoComponent),
  },
  {
    path: 'triagem',
    title: 'Triagem de montagem · Cão Saci',
    loadComponent: () => import('./pages/triagem/triagem.component').then((m) => m.TriagemComponent),
  },
  {
    path: 'estoque',
    title: 'Estoque físico · Cão Saci',
    loadComponent: () => import('./pages/estoque/estoque.component').then((m) => m.EstoqueComponent),
  },
  {
    path: 'sobre',
    title: 'Sobre · Cão Saci',
    loadComponent: () => import('./pages/sobre/sobre.component').then((m) => m.SobreComponent),
  },
  { path: '**', redirectTo: 'fila' },
];
