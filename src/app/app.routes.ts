import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LoginComponent } from './login/login.component';
import { isAuthGuard } from './guard/is-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'home', component: Home, title: 'Home - Crochet Tracker'},
  { path: 'login', component: LoginComponent, title: 'Login - BGG Library', canActivate: [isAuthGuard]}
];
