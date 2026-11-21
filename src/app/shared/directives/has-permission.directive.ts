import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  requiredPermission = input.required<string>({ alias: 'appHasPermission' });

  constructor() {
    effect(() => {
      const permission = this.requiredPermission();
      const hasPerm = this.authService.hasPermission(permission);

      this.viewContainer.clear();
      if (hasPerm) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
