import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: ` <section class="card narrow">
    <h1>Iniciar sesion</h1>
    <p class="muted">
      Acceso protegido con bcrypt, JWT de corta duracion y limite de intentos.
    </p>
    <label
      >Usuario<input
        [(ngModel)]="usuario"
        autocomplete="username"
        maxlength="30"
    /></label>
    <label
      >Contrasena<input
        type="password"
        [(ngModel)]="password"
        autocomplete="current-password"
        maxlength="72"
        (keyup.enter)="entrar()"
    /></label>
    <p class="error" *ngIf="error">{{ error }}</p>
    <button (click)="entrar()" [disabled]="cargando">
      {{ cargando ? "Validando..." : "Entrar" }}
    </button>
    <p class="muted link-row">
      ¿No tienes cuenta?
      <a routerLink="/registro">Registrate como solicitante</a>
    </p>
  </section>`,
})
export class LoginComponent {
  usuario = "";
  password = "";
  error = "";
  cargando = false;
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}
  entrar(): void {
    this.error = "";
    if (!this.usuario.trim() || !this.password) {
      this.error = "Captura usuario y contrasena.";
      return;
    }
    this.cargando = true;
    this.auth.login(this.usuario.trim(), this.password).subscribe({
      next: () => {
        this.cargando = false;
        void this.router.navigate(["/equipos"]);
      },
      error: (e) => {
        this.cargando = false;
        this.error = e?.error?.message || "No fue posible iniciar sesion.";
      },
    });
  }
}
