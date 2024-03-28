import { HttpErrorResponse } from '@angular/common/http';
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

import { UserCredentials } from '../models/user-credentials.model';
import { LoginService } from '../services/login.service';
import { EMAIL_REGEX_PATTERN } from '../constants/email-regex-pattern.constant';
import { LOGIN_FORM_COMPONENT_TEXT } from '../constants/login-form-component-text.constant';

@Component({
  selector: 'login-page',
  template: `
    <div
      class="bg-gray-50 h-full min-h-screen flex justify-center items-center"
    >
      <div class="flex flex-col sm:mx-auto sm:w-full sm:max-w-md">
        <!--error message-->
        <div
          *ngIf="!!formErrorMsg"
          class="flex-1 block ring-inset ring-1 ring-red-700 bg-red-600 text-white rounded px-6 py-3 mb-2"
          role="alert"
        >
          {{ formErrorMsg }}
        </div>
        <!--form-->
        <div
          class="flex-1 bg-white p-6 rounded-lg shadow-lg ring-1 ring-inset ring-gray-50"
        >
          <h2 class="text-3xl font-bold">{{ COMPONENT_TEXT.LOGIN_TITLE }}</h2>

          <form [formGroup]="form" (ngSubmit)="onFormSubmit()" class="mt-5">
            <div>
              <label for="email" class="block font-medium text-sm text-black"
                >Email</label
              >
              <input
                type="email"
                class="px-2 mt-1 block w-full rounded border-0 py-1.5 ring-1 ring-inset focus:ring-1"
                [ngClass]="{
                  'ring-red-600 ring-2': showError(form.controls.username),
                  'ring-gray-300': !showError(form.controls.username)
                }"
                id="email"
                formControlName="username"
                [placeholder]="COMPONENT_TEXT.EMAIL_PLACEHOLDER"
              />
              <!--error message-->
              <div class="mt-1 block rounded text-red-600 h-5 text-sm">
                <span *ngIf="showError(form.controls.username)">
                  {{ getErrorMsg(form.controls.username) }}
                </span>
              </div>
            </div>
            <!-- Password -->
            <div class="mt-2">
              <label for="password" class="block font-medium text-sm text-black"
                >Heslo</label
              >
              <input
                type="password"
                class="px-2 mt-1 block w-full rounded border-0 py-1.5 ring-1 ring-inset focus:ring-1"
                [ngClass]="{
                  'ring-red-600 ring-2': showError(form.controls.password),
                  'ring-gray-300': !showError(form.controls.password)
                }"
                id="password"
                formControlName="password"
                [placeholder]="COMPONENT_TEXT.PASSWORD_PLACEHOLDER"
              />
              <!--error message-->
              <div class="mt-1 block rounded text-red-600 h-5 text-sm">
                <span *ngIf="showError(form.controls.password)">
                  {{ getErrorMsg(form.controls.password) }}
                </span>
              </div>
            </div>
            <!--submit button-->
            <div class="block mt-4">
              <button
                type="submit"
                class="inline-block bg-blue-700 rounded w-full justify-center text-white font-medium py-2 select-none"
                [disabled]="isProcessing"
              >
                <span
                  *ngIf="isProcessing"
                  class="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-e-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                >
                </span>
                <span>
                  {{
                    isProcessing
                      ? COMPONENT_TEXT.LOGIN_PROCESS_ACTIVE_BTN_LABEL
                      : COMPONENT_TEXT.LOGIN_PROCESS_DEFAULT_BTN_LABEL
                  }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
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
  /** State of loading request process */
  protected isProcessing = false;
  /** Component texts */
  protected readonly COMPONENT_TEXT = LOGIN_FORM_COMPONENT_TEXT;

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

    if (this.isProcessing) {
      return;
    }

    const formValue = this.form.value as UserCredentials;

    this.toggleProcess(true);
    this.loginService
      .login(formValue)
      .pipe(
        finalize(() => {
          this.toggleProcess(false);
          this.form.reset();
        }),
      )
      .subscribe({
        next: () => {
          // on success redirect user somewhere...
        },
        error: (err) => {
          this.handleResponseMsg(err);
        },
      });
  }

  /**
   * Whether there are conditions to show error.
   * Would be better as pipe.
   * @param formControl
   */
  protected showError(formControl: FormControl) {
    return !!(formControl.errors && formControl.touched);
  }

  /**
   * Handle response from login endpoint
   * @param err Error response
   */
  protected handleResponseMsg(err: HttpErrorResponse) {
    // temporary solution, may be better have global error handling
    if (err.status === 401) {
      this.formErrorMsg = LOGIN_FORM_COMPONENT_TEXT.LOGIN_DATA_ERROR_MESSAGE;
    } else if (err.status === 502 || err.status === 503) {
      this.formErrorMsg = LOGIN_FORM_COMPONENT_TEXT.SERVICE_UNAVAILABLE;
    }
    // there can be other conditions...

    this.cdr.detectChanges();
  }

  /**
   * Get error message for specific form control.
   * Can be part of service.
   * @param formControl
   */
  protected getErrorMsg(formControl: FormControl): string | null {
    const errors = formControl.errors;

    if (!errors) {
      return null;
    }

    if (errors['required']) {
      return 'Povinná hodnota pole je prázdná';
    } else if (errors['email']) {
      return 'Neplatný formát emailu';
    } else if (errors['pattern']) {
      return 'Zadaná hodnota neodpovídá požadovanému formátu';
    } else if (errors['minlength']) {
      return `Minimální počet znaků je ${errors['minlength']['requiredLength']}`;
    } else if (errors['maxlength']) {
      return `Maximální počet znaků je ${errors['maxlength']['requiredLength']}`;
    }

    return null;
  }

  /**
   * Toggle loading indicator visibility
   * @param state
   */
  protected toggleProcess(state: boolean) {
    this.isProcessing = state;
    this.cdr.detectChanges();
  }
}
