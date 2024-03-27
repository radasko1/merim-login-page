import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserCredentials } from '../models/user-credentials.model';

@Injectable()
export class LoginService {
  // can be part of "environment"
  private readonly url = 'https://dash-api-dev1.reboot-qsr.com/v1/auth/login';

  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Login
   * @param userCredentials
   */
  public login(userCredentials: UserCredentials) {
    // transform form values into form-data
    const formData = new FormData();
    formData.append('username', userCredentials.username);
    formData.append('password', userCredentials.password);

    // may be good some token or captcha
    return this.httpClient.post(this.url, formData);
  }
}
