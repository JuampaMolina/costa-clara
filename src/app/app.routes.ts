import { Routes } from '@angular/router';
import { BeachesPage } from './features/beaches/beaches-page';

export const routes: Routes = [
  {
    path: '',
    component: BeachesPage,
    title: 'Costa Clara · Playas de Baleares',
  },
  { path: '**', redirectTo: '' },
];
