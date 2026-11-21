import { Routes } from '@angular/router';
import { TripsListComponent } from './pages/trips-list/trips-list.component';

export const TRIPS_ROUTES: Routes = [
  {
    path: '',
    component: TripsListComponent,
    title: 'إدارة الرحلات | Enterprise Portal'
  }
];
