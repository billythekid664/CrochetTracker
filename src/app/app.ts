import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from "./nav-bar/nav-bar";
import { HideNavService } from './service/hide-nav.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'CrochetTracker';
  isHideNav = false;
  subscription: any;

  constructor(private hideNavService: HideNavService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.subscription = this.hideNavService.checkHideNav()
        .subscribe((value) => {
          this.isHideNav = value;
          this.cdr.detectChanges();
        });
    ;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
