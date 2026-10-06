import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { HomeComponent } from './home/home.component';
import { NewOrderComponent } from './new-order/new-order.component';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'new-order', component: NewOrderComponent },
  { path: 'edit-order/:id', component: NewOrderComponent },
  { path: '**', redirectTo: '' }
];