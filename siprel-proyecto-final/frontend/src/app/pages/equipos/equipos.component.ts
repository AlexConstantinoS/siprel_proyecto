import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-equipos",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <section class="card" *ngIf="auth.isAdmin()">
      <div class="section-head">
        <div>
          <h1>{{ editandoId ? "Editar equipo" : "Registrar equipo" }}</h1>
          <p class="muted">
            CRUD administrativo mediante Stored Procedures parametrizados.
          </p>
        </div>
        <button *ngIf="editandoId" class="secondary" (click)="nuevo()">
          Nuevo
        </button>
      </div>
      <div class="grid-form">
        <div>
          <label>Codigo</label
          ><input
            [(ngModel)]="form.codigo"
            maxlength="30"
            placeholder="EQ-006"
          />
        </div>
        <div>
          <label>Nombre</label
          ><input
            [(ngModel)]="form.nombre"
            maxlength="150"
            placeholder="Nombre del equipo"
          />
        </div>
        <div>
          <label>Marca</label><input [(ngModel)]="form.marca" maxlength="80" />
        </div>
        <div>
          <label>Modelo</label
          ><input [(ngModel)]="form.modelo" maxlength="80" />
        </div>
        <div>
          <label>Numero de serie</label
          ><input [(ngModel)]="form.numeroSerie" maxlength="100" />
        </div>
        <div>
          <label>Categoria</label
          ><select [(ngModel)]="form.categoriaId">
            <option [ngValue]="0">Seleccione...</option>
            <option *ngFor="let c of categorias" [ngValue]="c.categoria_id">
              {{ c.nombre }}
            </option>
          </select>
        </div>
        <div>
          <label>Estado</label
          ><select [(ngModel)]="form.estado">
            <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
          </select>
        </div>
        <div>
          <label>Ubicacion</label
          ><input [(ngModel)]="form.ubicacion" maxlength="120" />
        </div>
        <div class="full">
          <label>Observaciones</label
          ><textarea
            [(ngModel)]="form.observaciones"
            rows="3"
            maxlength="500"
          ></textarea>
        </div>
        <label class="check-label"
          ><input type="checkbox" [(ngModel)]="form.activo" /> Equipo
          activo</label
        >
      </div>
      <div class="actions">
        <button (click)="guardar()">
          {{ editandoId ? "Guardar cambios" : "Registrar equipo" }}</button
        ><button *ngIf="editandoId" class="secondary" (click)="nuevo()">
          Cancelar
        </button>
      </div>
      <p class="success" *ngIf="mensaje">{{ mensaje }}</p>
      <p class="error" *ngIf="error">{{ error }}</p>
    </section>

    <section class="card">
      <div class="section-head">
        <div>
          <h1>Catalogo de equipos</h1>
          <p class="muted">
            Busqueda protegida mediante Stored Procedure parametrizado y
            validacion del servidor.
          </p>
        </div>
        <label class="inline-check" *ngIf="auth.isAdmin()"
          ><input
            type="checkbox"
            [(ngModel)]="incluirInactivos"
            (change)="cargar()"
          />
          Mostrar inactivos</label
        >
      </div>
      <div class="toolbar">
        <input
          [(ngModel)]="buscar"
          maxlength="100"
          placeholder="Nombre, codigo o marca"
          (keyup.enter)="cargar()"
        /><button (click)="cargar()">Buscar</button>
      </div>
      <p class="error" *ngIf="error && !auth.isAdmin()">{{ error }}</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Equipo</th>
              <th>Marca</th>
              <th>Categoria</th>
              <th>Estado</th>
              <th>Ubicacion</th>
              <th *ngIf="auth.isAdmin()">Activo</th>
              <th *ngIf="auth.isAdmin()">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of equipos">
              <td>{{ e.equipo_id }}</td>
              <td>{{ e.codigo }}</td>
              <td>{{ e.nombre }}</td>
              <td>{{ e.marca }}</td>
              <td>{{ e.categoria }}</td>
              <td>{{ e.estado }}</td>
              <td>{{ e.ubicacion }}</td>
              <td *ngIf="auth.isAdmin()">
                <span class="status" [class.inactive]="!e.activo">{{
                  e.activo ? "ACTIVO" : "INACTIVO"
                }}</span>
              </td>
              <td *ngIf="auth.isAdmin()">
                <div class="row-actions">
                  <button class="small-btn" (click)="editar(e)">Editar</button
                  ><button
                    class="small-btn danger-btn"
                    [disabled]="!e.activo"
                    (click)="eliminar(e)"
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
export class EquiposComponent {
  buscar = "";
  equipos: any[] = [];
  categorias: any[] = [];
  incluirInactivos = false;
  editandoId: number | null = null;
  error = "";
  mensaje = "";
  estados = ["DISPONIBLE", "RESERVADO", "PRESTADO", "MANTENIMIENTO", "BAJA"];
  form: any = {
    codigo: "",
    nombre: "",
    marca: "",
    modelo: "",
    numeroSerie: "",
    categoriaId: 0,
    estado: "DISPONIBLE",
    ubicacion: "",
    observaciones: "",
    activo: true,
  };
  constructor(
    private api: ApiService,
    public auth: AuthService,
  ) {
    if (this.auth.isAdmin()) this.cargarCategorias();
    this.cargar();
  }
  cargar() {
    this.error = "";
    const obs = this.auth.isAdmin()
      ? this.api.listarEquiposGestion(this.buscar.trim(), this.incluirInactivos)
      : this.api.buscarEquipos(this.buscar.trim());
    obs.subscribe({
      next: (d) => (this.equipos = d),
      error: (e) =>
        (this.error = e?.error?.message || "Error al consultar equipos."),
    });
  }
  cargarCategorias() {
    this.api
      .listarCategoriasEquipo()
      .subscribe({
        next: (d) => (this.categorias = d),
        error: (e) =>
          (this.error = e?.error?.message || "Error al consultar categorias."),
      });
  }
  nuevo() {
    this.editandoId = null;
    this.form = {
      codigo: "",
      nombre: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
      categoriaId: 0,
      estado: "DISPONIBLE",
      ubicacion: "",
      observaciones: "",
      activo: true,
    };
    this.error = "";
    this.mensaje = "";
  }
  editar(e: any) {
    this.editandoId = e.equipo_id;
    this.form = {
      codigo: e.codigo || "",
      nombre: e.nombre || "",
      marca: e.marca || "",
      modelo: e.modelo || "",
      numeroSerie: e.numero_serie || "",
      categoriaId: Number(e.categoria_id || 0),
      estado: e.estado || "DISPONIBLE",
      ubicacion: e.ubicacion || "",
      observaciones: e.observaciones || "",
      activo: Boolean(e.activo),
    };
    this.error = "";
    this.mensaje = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  guardar() {
    this.error = "";
    this.mensaje = "";
    if (
      !this.form.codigo.trim() ||
      this.form.nombre.trim().length < 3 ||
      !this.form.categoriaId
    ) {
      this.error = "Completa codigo, nombre y categoria.";
      return;
    }
    const req = this.editandoId
      ? this.api.actualizarEquipo(this.editandoId, this.form)
      : this.api.crearEquipo(this.form);
    req.subscribe({
      next: () => {
        this.mensaje = this.editandoId
          ? "Equipo actualizado."
          : "Equipo registrado.";
        this.nuevoConMensaje(this.mensaje);
        this.cargar();
      },
      error: (e) =>
        (this.error = e?.error?.message || "No fue posible guardar el equipo."),
    });
  }
  nuevoConMensaje(m: string) {
    this.editandoId = null;
    this.form = {
      codigo: "",
      nombre: "",
      marca: "",
      modelo: "",
      numeroSerie: "",
      categoriaId: 0,
      estado: "DISPONIBLE",
      ubicacion: "",
      observaciones: "",
      activo: true,
    };
    this.mensaje = m;
  }
  eliminar(e: any) {
    if (!confirm(`Dar de baja el equipo ${e.codigo}?`)) return;
    this.error = "";
    this.api.eliminarEquipo(e.equipo_id).subscribe({
      next: () => {
        this.mensaje = "Equipo dado de baja.";
        this.cargar();
      },
      error: (x) =>
        (this.error =
          x?.error?.message || "No fue posible dar de baja el equipo."),
    });
  }
}
