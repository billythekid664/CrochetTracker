import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HideNavService {
  private hideNav: BehaviorSubject <boolean> = new BehaviorSubject(false);
  hideNavObservable: Observable<boolean> = this.hideNav.asObservable();

  checkHideNav(): Observable<boolean> {
    return this.hideNavObservable;
  }

  setHideNav(value: boolean): void {
    this.hideNav.next(value);
  }
}
