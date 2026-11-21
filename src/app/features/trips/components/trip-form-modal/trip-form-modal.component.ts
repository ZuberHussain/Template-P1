import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CreateTripDto } from '../../models/trip.model';

@Component({
  selector: 'app-trip-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  templateUrl: './trip-form-modal.component.html',
  styleUrl: './trip-form-modal.component.scss'
})
export class TripFormModalComponent {
  private readonly fb = inject(FormBuilder);

  isOpen = input<boolean>(false);
  saveTrip = output<CreateTripDto>();
  closeModal = output<void>();

  readonly submitted = signal<boolean>(false);

  readonly tripForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2050)]],
    status: ['draft', [Validators.required]],
    note: ['']
  });

  get nameControl() {
    return this.tripForm.get('name');
  }

  get yearControl() {
    return this.tripForm.get('year');
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const val = this.tripForm.value;
    this.saveTrip.emit({
      name: val.name,
      year: Number(val.year),
      status: val.status,
      note: val.note
    });

    this.resetForm();
  }

  onCancel(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  private resetForm(): void {
    this.submitted.set(false);
    this.tripForm.reset({
      name: '',
      year: new Date().getFullYear(),
      status: 'draft',
      note: ''
    });
  }
}
