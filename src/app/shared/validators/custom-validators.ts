import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Enterprise email validator with RFC 5322 compliance pattern
   */
  static emailValidator(): ValidatorFn {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const valid = emailRegex.test(control.value);
      return valid ? null : { invalidEmail: true };
    };
  }

  /**
   * Enterprise password strength:
   * Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special char
   */
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;

      const hasUpperCase = /[A-Z]/.test(val);
      const hasLowerCase = /[a-z]/.test(val);
      const hasNumeric = /[0-9]/.test(val);
      const hasMinLength = val.length >= 6;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasMinLength;

      return !passwordValid
        ? {
            passwordStrength: {
              hasUpperCase,
              hasLowerCase,
              hasNumeric,
              hasMinLength
            }
          }
        : null;
    };
  }
}
