import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../service/user.service';
import { ActiveService } from '../service/active.service';
import { getAdditionalUserInfo } from '@angular/fire/auth';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private activeService = inject(ActiveService)
  userSubscription?: Subscription;
  loginForm!: FormGroup;
  isRegister: boolean = false;
  cantLogin: boolean = false;
  cantRegister: boolean = false;
  redirectUrl = '/';

  confirmPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    return control.value === this.loginForm?.get('password')?.value
      ? null
      : { PasswordNoMatch: true };
  };

  constructor() {
    this.createLoginForm();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.redirectUrl = params['redirectUrl'] ? decodeURIComponent(params['redirectUrl']) : '/';
    });
  }

  ngAfterViewInit(): void {
      this.activeService.setActiveNavTab(3)
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  createLoginForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
    });
  }

  createRegisterForm() {
    this.loginForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20), Validators.pattern( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_@$!%*?&])[A-Za-z\d_@$!%*?&]{8,20}$/)]],
      confirmPassword: ['', [Validators.required, this.confirmPasswordValidator]]
    });
  }

  checkPasswordErrors(passwordType: string) {
    const passwordControl = this.loginForm.get(passwordType);
    if (passwordControl?.invalid) {
      if (passwordControl?.hasError('required')) {
        return 'Password is required';
      } else if (passwordControl?.hasError('minlength')) {
        return 'Password must be at least 8 characters long';
      } else if (passwordControl?.hasError('maxlength')) {
        return 'Password must be no more than 20 characters long';
      } else if (passwordControl?.hasError('pattern')) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      } else if (passwordControl?.hasError('PasswordNoMatch')) {
        return 'Passwords do not match';
      }
    }
    return null;
  }

  checkEmailErrors() {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.invalid) {
      if (emailControl?.hasError('required')) {
        return 'Email is required';
      } else if (emailControl?.hasError('email')) {
        return 'Please enter a valid email address';
      }
    }
    return null;
  }

  togglePassword(toggleId: string, passwordId: string) {
    const togglePassword: Element = document.querySelector(`#${toggleId}`)!;
    const password = document.querySelector(`#${passwordId}`)!;
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    togglePassword.classList.toggle('bi-eye');
  }

  toggleRegister() {
    if (this.isRegister) {
      this.createLoginForm();
      this.isRegister = !this.isRegister;
    } else {
      this.createRegisterForm();
      this.isRegister = !this.isRegister;
    }
  }

  onSubmit() {
    this.userService.signUserIn(this.loginForm.value.email, this.loginForm.value.password).then((userCredential: any) => {
      this.router.navigate([this.redirectUrl]);
      }).catch((error: any) => {
        this.cantLogin = true;
      });
  }

  onSubmitRegister() {
    this.userService.createUser(this.loginForm.value.email, this.loginForm.value.password).then((userCredential: any) => {
      let additionalInfo = getAdditionalUserInfo(userCredential);
      this.userService.addUser({
        uid: userCredential.user.uid,
        firstName: this.loginForm.value.firstName,
        lastName: this.loginForm.value.lastName,
        provider: (additionalInfo?.providerId || 'firebase'),
        email: userCredential.user.email?.toLocaleLowerCase()
      });
      this.router.navigate([this.redirectUrl]);
    }).catch((error: any) => {
      console.error('Error registering:', error);
      this.cantRegister = true;
    });
  }

  googleLogin() {
    this.userService.signUserInWithGoogle().then((userCredential: any) => {
      let additionalInfo = getAdditionalUserInfo(userCredential);
      if (additionalInfo?.isNewUser) {
        this.userService.addUser({
          uid: userCredential.user.uid,
          firstName: userCredential.user.displayName.split(' ')[0],
          lastName: userCredential.user.displayName.split(' ')[1],
          provider: userCredential.providerId,
          email: userCredential.user.email?.toLocaleLowerCase()
        });
      }
      this.router.navigate([this.redirectUrl]);
    }).catch(error => {
      console.error('Error logging in with Google:', error);
    });
  }
}
