import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/api.service";

@Component({
  selector: "app-usuarios",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <section class="card">
      <div class="section-head">
        <div>
          <h1>Administracion de usuarios</h1>
          <p class="muted">
            CRUD completo protegido por rol ADMIN. Las contrasenas se almacenan
            con bcrypt.
          </p>
        </div>
        <button class="secondary" (click)="nuevo()">Nuevo usuario</button>
      </div>
    </section>
    <section class="card">
      <h2>
        {{
          form.cuentaId
            ? "Editar usuario #" + form.cuentaId
            : "Registrar usuario"
        }}
      </h2>
      <div class="grid-form">
        <label>Usuario<input [(ngModel)]="form.usuario" maxlength="30" /></label
        ><label
          >Contrasena<input
            type="password"
            [(ngModel)]="form.password"
            maxlength="72"
            [placeholder]="
              form.cuentaId
                ? 'Dejar vacio para conservar'
                : 'Minimo 10 caracteres'
            "
        /></label>
        <label
          >Nombre completo<input
            [(ngModel)]="form.nombre"
            maxlength="120" /></label
        ><label
          >Correo<input type="email" [(ngModel)]="form.email" maxlength="150"
        /></label>
        <label
          >Rol<select [(ngModel)]="form.rolId">
            <option [ngValue]="null">Seleccione...</option>
            <option *ngFor="let r of roles" [ngValue]="r.rol_id">
              {{ r.nombre }}
            </option>
          </select></label
        >
        <label class="check-label"
          ><input type="checkbox" [(ngModel)]="form.activo" />Cuenta
          activa</label
        >
      </div>
      <small
        >Politica: 10-72 caracteres, mayuscula, minuscula, numero y
        simbolo.</small
      >
      <p class="error" *ngIf="error">{{ error }}</p>
      <p class="success" *ngIf="mensaje">{{ mensaje }}</p>
      <div class="actions">
        <button (click)="guardar()" [disabled]="guardando">
          {{
            guardando
              ? "Guardando..."
              : form.cuentaId
                ? "Guardar cambios"
                : "Registrar usuario"
          }}</button
        ><button class="secondary" *ngIf="form.cuentaId" (click)="nuevo()">
          Cancelar
        </button>
      </div>
    </section>
    <section class="card">
      <div class="section-head">
        <div>
          <h2>Usuarios registrados</h2>
          <p class="muted">
            Eliminar aplica baja logica para conservar trazabilidad e integridad
            referencial.
          </p>
        </div>
        <label class="inline-check"
          ><input
            type="checkbox"
            [(ngModel)]="incluirInactivos"
            (change)="cargarUsuarios()"
          />Mostrar inactivos</label
        >
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios">
              <td>{{ u.cuenta_id }}</td>
              <td>{{ u.usuario }}</td>
              <td>{{ u.nombre }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.rol }}</td>
              <td>
                <span class="status" [class.inactive]="!u.activo">{{
                  u.activo ? "ACTIVO" : "INACTIVO"
                }}</span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="small-btn" (click)="editar(u)">Editar</button
                  ><button
                    class="small-btn danger-btn"
                    (click)="eliminar(u)"
                    [disabled]="!u.activo"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`,
})
export class UsuariosComponent {
  usuarios: any[] = [];
  roles: any[] = [];
  incluirInactivos = false;
  guardando = false;
  error = "";
  mensaje = "";
  form: any = this.vacio();
  constructor(private api: ApiService) {
    this.cargarRoles();
    this.cargarUsuarios();
  }
  vacio() {
    return {
      cuentaId: null,
      usuario: "",
      password: "",
      nombre: "",
      email: "",
      rolId: null,
      activo: true,
    };
  }
  cargarRoles() {
    this.api
      .listarRoles()
      .subscribe({
        next: (d) => (this.roles = d),
        error: (e) => (this.error = this.msg(e)),
      });
  }
  cargarUsuarios() {
    this.api
      .listarUsuarios(this.incluirInactivos)
      .subscribe({
        next: (d) => (this.usuarios = d),
        error: (e) => (this.error = this.msg(e)),
      });
  }
  nuevo() {
    this.form = this.vacio();
    this.error = "";
    this.mensaje = "";
  }
  editar(u: any) {
    this.form = {
      cuentaId: u.cuenta_id,
      usuario: u.usuario,
      password: "",
      nombre: u.nombre,
      email: u.email,
      rolId: u.rol_id,
      activo: Boolean(u.activo),
    };
    this.error = "";
    this.mensaje = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  guardar() {
    this.error = "";
    this.mensaje = "";
    const userRe = /^[A-Za-z0-9._-]{4,30}$/;
    const passRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,72}$/;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !userRe.test(this.form.usuario.trim()) ||
      this.form.nombre.trim().length < 3 ||
      !emailRe.test(this.form.email.trim()) ||
      !this.form.rolId
    ) {
      this.error = "Verifica usuario, nombre, correo y rol.";
      return;
    }
    if (!this.form.cuentaId && !this.form.password) {
      this.error = "La contrasena es obligatoria al crear.";
      return;
    }
    if (this.form.password && !passRe.test(this.form.password)) {
      this.error = "La contrasena no cumple la politica de seguridad.";
      return;
    }
    this.guardando = true;
    const payload = {
      usuario: this.form.usuario.trim(),
      password: this.form.password || null,
      nombre: this.form.nombre.trim(),
      email: this.form.email.trim(),
      rolId: this.form.rolId,
      activo: this.form.activo,
    };
    const req = this.form.cuentaId
      ? this.api.actualizarUsuario(this.form.cuentaId, payload)
      : this.api.crearUsuario({ ...payload, password: this.form.password });
    req.subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = this.form.cuentaId
          ? "Usuario actualizado."
          : "Usuario registrado.";
        this.form = this.vacio();
        this.cargarUsuarios();
      },
      error: (e) => {
        this.guardando = false;
        this.error = this.msg(e);
      },
    });
  }
  eliminar(u: any) {
    if (!confirm(`Se dara de baja a ${u.usuario}. ¿Continuar?`)) return;
    this.api.eliminarUsuario(u.cuenta_id).subscribe({
      next: () => {
        this.mensaje = "Usuario dado de baja.";
        this.cargarUsuarios();
      },
      error: (e) => (this.error = this.msg(e)),
    });
  }
  msg(e: any) {
    return e?.error?.message || "Ocurrio un error al procesar la solicitud.";
  }
}
