import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-registro",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: ` <section class="card narrow">
    <h1>Registro de solicitante</h1>
    <p class="muted">
      Las cuentas creadas aqui reciben exclusivamente el rol SOLICITANTE.
    </p>
    <label>Usuario<input [(ngModel)]="form.usuario" maxlength="30" /></label
    ><label
      >Nombre completo<input [(ngModel)]="form.nombre" maxlength="120"
    /></label>
    <label
      >Correo<input
        type="email"
        [(ngModel)]="form.email"
        maxlength="150" /></label
    ><label
      >Contrasena<input
        type="password"
        [(ngModel)]="form.password"
        maxlength="72"
    /></label>
    <small>Minimo 10 caracteres, mayuscula, minuscula, numero y simbolo.</small>
    <p class="error" *ngIf="error">{{ error }}</p>
    <p class="success" *ngIf="mensaje">{{ mensaje }}</p>
    <button (click)="registrar()" [disabled]="cargando">
      {{ cargando ? "Registrando..." : "Crear cuenta" }}
    </button>
    <p class="muted link-row">
      <a routerLink="/login">Volver al inicio de sesion</a>
    </p>
  </section>`,
})
export class RegistroComponent {
  form = { usuario: "", nombre: "", email: "", password: "" };
  error = "";
  mensaje = "";
  cargando = false;
  constructor(private auth: AuthService) {}
  registrar(): void {
    this.error = "";
    this.mensaje = "";
    const userRe = /^[A-Za-z0-9._-]{4,30}$/;
    const passRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,72}$/;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userRe.test(this.form.usuario.trim())) {
      this.error = "Usuario invalido: usa 4-30 caracteres permitidos.";
      return;
    }
    if (this.form.nombre.trim().length < 3) {
      this.error = "Captura un nombre valido.";
      return;
    }
    if (!emailRe.test(this.form.email.trim())) {
      this.error = "Correo invalido.";
      return;
    }
    if (!passRe.test(this.form.password)) {
      this.error = "La contrasena no cumple la politica indicada.";
      return;
    }
    this.cargando = true;
    this.auth
      .registro({
        ...this.form,
        usuario: this.form.usuario.trim(),
        nombre: this.form.nombre.trim(),
        email: this.form.email.trim(),
      })
      .subscribe({
        next: (r) => {
          this.cargando = false;
          this.mensaje = r.message;
          this.form = { usuario: "", nombre: "", email: "", password: "" };
        },
        error: (e) => {
          this.cargando = false;
          this.error =
            e?.error?.message || "No fue posible registrar la cuenta.";
        },
      });
  }
}
