import { Directive, ElementRef, inject, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: true
})
export class AutofocusDirective implements AfterViewInit {
  private readonly el = inject(ElementRef);

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.el.nativeElement.focus) {
        this.el.nativeElement.focus();
      }
    }, 100);
  }
}
