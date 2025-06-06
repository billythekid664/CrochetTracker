import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActiveService {
  private activeNavTab: BehaviorSubject<number> = new BehaviorSubject(1);
  private activeNavTabObservable: Observable<number> = this.activeNavTab.asObservable();

  checkActiveNavTab(): Observable<number> {
    return this.activeNavTabObservable;
  }

  setActiveNavTab(value: number): void {
    this.activeNavTab.next(value);
  }
}
