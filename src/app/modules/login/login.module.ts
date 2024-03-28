import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { LoginService } from './services/login.service';
import { LoginPageComponent } from './components/login-page.component';
import { LoginRoutingModule } from './login-routing.module';

@NgModule({
  declarations: [LoginPageComponent],
  imports: [LoginRoutingModule, ReactiveFormsModule, CommonModule],
  providers: [LoginService],
})
export class LoginModule {}
