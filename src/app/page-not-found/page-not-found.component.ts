import { Component, OnDestroy, OnInit } from '@angular/core';
import { HideNavService } from '../service/hide-nav.service';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css'
})
export class PageNotFoundComponent implements OnInit, OnDestroy {
  constructor(private hideNavService: HideNavService) { }

  ngOnInit(): void {
    this.hideNavService.setHideNav(true);
  }

  ngOnDestroy(): void {
      this.hideNavService.setHideNav(false);
  }
}
