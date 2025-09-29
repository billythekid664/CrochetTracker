import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LoginComponent } from './login/login.component';
import { isAuthGuard } from './auth/is-auth.guard';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'home', component: Home, title: 'Home - Crochet Tracker', canActivate: [authGuard]},
  { path: 'login', component: LoginComponent, title: 'Login - Crochet Tracker', canActivate: [isAuthGuard]},
  { path: '**', component: PageNotFoundComponent, title: 'Page Not Found - Crochet Tracker' }
];
