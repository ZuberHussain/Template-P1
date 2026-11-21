import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { CardComponent } from '@shared/components/card/card.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);

  readonly user = this.authService.currentUser;

  triggerTestNotification(type: 'success' | 'warning' | 'error' | 'info'): void {
    switch (type) {
      case 'success':
        this.notificationService.success('Enterprise trip telemetry sync complete!', 'Sync Successful');
        break;
      case 'warning':
        this.notificationService.warning('Multiple trips are currently in Draft status awaiting manager approval.', 'Operations Warning');
        break;
      case 'error':
        this.notificationService.error('Failed to establish connection to secondary logistics replica.', 'Database Timeout');
        break;
      case 'info':
        this.notificationService.info('Role permissions updated successfully on data table actions.', 'Security Policy');
        break;
    }
  }
}
