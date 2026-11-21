import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CustomValidators } from '@shared/validators/custom-validators';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AutofocusDirective } from '@shared/directives/autofocus.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    AutofocusDirective
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);

  readonly isLoading = this.authService.isLoading;
  readonly showPassword = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, CustomValidators.emailValidator()]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true]
  });

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(prev => !prev);
  }

  /**
   * Helper to quickly fill demo enterprise credentials for instant testing
   */
  fillDemoCredentials(role: 'admin' | 'developer'): void {
    if (role === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@enterprise.com',
        password: 'Enterprise@123',
        rememberMe: true
      });
    } else {
      this.loginForm.patchValue({
        email: 'user@enterprise.com',
        password: 'User@123',
        rememberMe: true
      });
    }
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Authentication failed. Please verify your credentials.');
      }
    });
  }

  handleSsoLogin(provider: string): void {
    this.notificationService.info(
      `Redirecting to ${provider} Enterprise Identity Provider...`,
      'Enterprise SSO'
    );
  }
}
