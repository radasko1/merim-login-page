import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { EMAIL_REGEX_PATTERN } from '../constants/email-regex-pattern.constant';
import { UserCredentials } from '../models/user-credentials.model';
import { LoginService } from '../services/login.service';

// TODO responsive
const LOGIN_ERROR_MESSAGE =
  'Chybné přihlášení. Prosím, zkontrolujte své uživatelské jméno a heslo a zkuste to znovu.';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  /** Form error message */
  protected formErrorMsg: string | undefined;
  /** User form */
  protected form = this.formBuilder.group({
    username: this.formBuilder.control<string>('', {
      validators: [
        Validators.required,
        Validators.pattern(EMAIL_REGEX_PATTERN), // Validators.email,
        Validators.maxLength(255),
      ],
    }),
    password: this.formBuilder.control<string>('', {
      // no more validations
      validators: [Validators.required],
    }),
  });

  constructor(
    readonly title: Title,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly loginService: LoginService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    title.setTitle('Přihlášení');
  }

  /**
   * Handle form submit action
   */
  protected onFormSubmit() {
    if (this.form.status !== 'VALID') {
      return;
    }

    const formValue = this.form.value as UserCredentials;

    this.loginService
      .login(formValue)
      .pipe(
        finalize(() => {
          this.form.reset();
        }),
      )
      .subscribe({
        next: () => {
          // on success redirect user somewhere...
        },
        error: (err) => {
          // filter through error status response?
          this.handleResponseMsg(err);
        },
      });
  }

  /**
   * Whether there are conditions to show error.
   * Would be better as pipe.
   * @param form
   */
  protected showError(form: FormControl) {
    return !!(form.errors && form.touched);
  }

  protected handleResponseMsg(err: any) {
    if (err.status === 401) {
      this.formErrorMsg = LOGIN_ERROR_MESSAGE;
    }

    // render template to see changes
    this.cdr.detectChanges();
  }

  /**
   * Get error message for specific form control.
   * Can be part of service.
   * @param formControl
   */
  protected getErrorMsg(formControl: FormControl): string | null {
    const formControlErrors = formControl.errors;

    if (!formControlErrors) {
      return null;
    }

    if (formControlErrors['required']) {
      return 'Pole je povinné';
    }
    if (formControlErrors['email']) {
      return 'Neplatný formát pro email';
    }
    if (formControlErrors['pattern']) {
      return 'Neplatný formát';
    }
    if (formControlErrors['maxlength']) {
      const errorBody = formControl.errors['maxlength']; // TODO type?
      return `Maximální povolená hodnota je ${errorBody['requiredLength']} znaků`;
    }

    return null;
  }
}
