import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LoginComponent } from './login/login.component';
import { isAuthGuard } from './guard/is-auth.guard';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'home', component: Home, title: 'Home - Crochet Tracker'},
  { path: 'login', component: LoginComponent, title: 'Login - Crochet Tracker', canActivate: [isAuthGuard]},
  { path: '**', component: PageNotFoundComponent, title: 'Page Not Found - Crochet Tracker' }
];
