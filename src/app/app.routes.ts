import { Routes } from '@angular/router';
import { BeachesPage } from './features/beaches/beaches-page';
import { NotFound } from './features/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    component: BeachesPage,
  },
  {
    path: 'real',
    component: BeachesPage,
    data: { dataset: 'osm' },
    title: 'Datos reales (OSM) · Costa Clara',
  },
  {
    path: '**',
    component: NotFound,
    title: 'Página no encontrada · Costa Clara',
  },
];
