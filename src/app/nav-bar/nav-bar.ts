import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../service/user.service';
import { ActiveService } from '../service/active.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  imports: [CommonModule, RouterLink],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private activeService = inject(ActiveService);
  active: number = 1;
  loggedIn: boolean = false;
  userSubscription: any;
  querySub: any;
  redirectUrl = { redirectUrl: '/' }
  displayName?: string;
  email?: string;

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe(params => {
      if (params['redirectUrl']) {
        this.redirectUrl = { redirectUrl: decodeURIComponent(params['redirectUrl'])};
      } else {
        this.redirectUrl = { redirectUrl: '/' };
      }
    });
    this.userSubscription = this.userService.checkAuth().subscribe((user: any) => {
        this.loggedIn = !!user;
        if (!!user?.uid) {
          this.getUserData(user.uid);
          if (![1,2,3].includes(this.active)) {
            this.activeService.setActiveNavTab(1);
          }
        }
    });
  }

  ngAfterViewInit(): void {
    this.activeService.checkActiveNavTab().subscribe((active: number) => {
      this.active = active;
    });
  }

  ngOnDestroy(): void {
    this.querySub.unsubscribe();
    this.userSubscription.unsubscribe();
  }

  handleNavClick(index: number): void {
    this.activeService.setActiveNavTab(index);
    if (this.docWidthLessThan768()) {
      document.getElementById('navToggleButton')?.click();
    }
  }


  getUserData(uid: string) {
    this.userService.fetchUser(uid).subscribe((user: any) => {
      if (!!user) {
        this.displayName = `${user?.firstName} ${user?.lastName}`.normalize();
        this.email = user.email;
      }
    });
  }

  logout() {
    this.userService.signUserOut();
    this.loggedIn = false;
    this.router.navigate(['/']);
    this.active = 1;
  }

  docWidthLessThan768() {
    return document.body.clientWidth < 768;
  }
}
