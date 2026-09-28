import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <header class="topbar">
      <div><strong>SIPREL</strong><span class="phase">PROYECTO FINAL · VERSION SEGURA</span></div>
      <nav *ngIf="auth.isLoggedIn(); else publicNav">
        <span class="user-chip">{{ auth.user()?.usuario }} · {{ auth.user()?.rol }}</span>
        <a routerLink="/equipos">Equipos</a><a routerLink="/prestamos">Prestamos</a><a routerLink="/reservas">Reservas</a><a routerLink="/incidencias">Incidencias</a>
        <a *ngIf="auth.isAdmin()" routerLink="/usuarios">Usuarios</a><a *ngIf="auth.isAdmin()" routerLink="/auditoria">Auditoria</a>
        <button type="button" (click)="logout()">Salir</button>
      </nav>
      <ng-template #publicNav><nav><a routerLink="/login">Iniciar sesion</a><a routerLink="/registro">Registro</a></nav></ng-template>
    </header>
    <main class="container"><router-outlet /></main>
  `
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}
  logout(): void { this.auth.logout(); void this.router.navigate(['/login']); }
}
