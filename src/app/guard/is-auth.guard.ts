import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../service/user.service';
import { map } from 'rxjs';

export const isAuthGuard: CanActivateFn = (route, state) => {
  let userService = inject(UserService);
  let router = inject(Router);
  return userService.checkAuth().pipe(
    map(u => {
      if (u) {
        router.navigate(['/']);
        return false;
      }
      return true;
    }));
};
