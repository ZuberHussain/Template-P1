import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { UserRole } from '@core/models/user.model';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly currentTheme = this.themeService.currentTheme;

  // Sidebar toggle state (open / closed)
  readonly isSidebarOpen = signal<boolean>(true);

  currentYear = new Date().getFullYear();

  toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Switch between roles to test permission-based visibility in the data table
   */
  switchRole(role: UserRole): void {
    this.authService.switchRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
}
