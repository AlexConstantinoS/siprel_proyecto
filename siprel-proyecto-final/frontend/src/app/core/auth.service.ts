import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface SessionUser {
  cuenta_id: number;
  usuario: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'ENCARGADO' | 'SOLICITANTE';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'siprel_token';
  private readonly userKey = 'siprel_user';
  constructor(private http: HttpClient) {}

  login(usuario: string, password: string) {
    return this.http.post<any>('/api/v1/auth/login', { usuario, password }).pipe(
      tap(response => {
        sessionStorage.setItem(this.tokenKey, response.token);
        sessionStorage.setItem(this.userKey, JSON.stringify(response.usuario));
      })
    );
  }

  registro(data: { usuario: string; password: string; nombre: string; email: string }) {
    return this.http.post<any>('/api/v1/auth/registro', data);
  }

  token(): string | null { return sessionStorage.getItem(this.tokenKey); }
  user(): SessionUser | null {
    const raw = sessionStorage.getItem(this.userKey);
    if (!raw) return null;
    try { return JSON.parse(raw) as SessionUser; } catch { return null; }
  }
  isLoggedIn(): boolean { return Boolean(this.token() && this.user()); }
  isAdmin(): boolean { return this.user()?.rol === 'ADMIN'; }
  isStaff(): boolean { return ['ADMIN', 'ENCARGADO'].includes(this.user()?.rol || ''); }
  logout(): void { sessionStorage.removeItem(this.tokenKey); sessionStorage.removeItem(this.userKey); }
}
