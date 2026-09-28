import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-prestamos",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <section class="card" *ngIf="auth.isStaff()">
      <div class="section-head">
        <div>
          <h1>{{ editandoId ? "Editar prestamo" : "Registrar prestamo" }}</h1>
          <p class="muted">
            ADMIN y ENCARGADO gestionan prestamos; la baja se conserva como
            CANCELADO para mantener trazabilidad.
          </p>
        </div>
        <button *ngIf="editandoId" class="secondary" (click)="nuevo()">
          Nuevo
        </button>
      </div>
      <div class="grid-form">
        <div>
          <label>Solicitante</label
          ><select [(ngModel)]="form.cuentaId">
            <option [ngValue]="0">Seleccione...</option>
            <option *ngFor="let c of cuentas" [ngValue]="c.cuenta_id">
              {{ c.nombre }} ({{ c.usuario }})
            </option>
          </select>
        </div>
        <div>
          <label>Equipo</label
          ><select [(ngModel)]="form.equipoId">
            <option [ngValue]="0">Seleccione...</option>
            <option *ngFor="let e of equipos" [ngValue]="e.equipo_id">
              {{ e.codigo }} - {{ e.nombre }} [{{ e.estado }}]
            </option>
          </select>
        </div>
        <div>
          <label>Fecha compromiso</label
          ><input type="datetime-local" [(ngModel)]="form.fechaCompromiso" />
        </div>
        <div *ngIf="editandoId">
          <label>Fecha devolucion</label
          ><input type="datetime-local" [(ngModel)]="form.fechaDevolucion" />
        </div>
        <div>
          <label>Estado</label
          ><select [(ngModel)]="form.estado">
            <option *ngFor="let e of estadosDisponibles" [value]="e">
              {{ e }}
            </option>
          </select>
        </div>
        <div>
          <label>Condicion de salida</label
          ><input [(ngModel)]="form.condicionSalida" maxlength="300" />
        </div>
        <div *ngIf="editandoId">
          <label>Condicion de entrada</label
          ><input [(ngModel)]="form.condicionEntrada" maxlength="300" />
        </div>
        <div class="full">
          <label>Observaciones</label
          ><textarea
            rows="3"
            [(ngModel)]="form.observaciones"
            maxlength="500"
          ></textarea>
        </div>
      </div>
      <div class="actions">
        <button (click)="guardar()">
          {{ editandoId ? "Guardar cambios" : "Registrar prestamo" }}</button
        ><button *ngIf="editandoId" class="secondary" (click)="nuevo()">
          Cancelar
        </button>
      </div>
      <p class="success" *ngIf="mensaje">{{ mensaje }}</p>
      <p class="error" *ngIf="error">{{ error }}</p>
    </section>

    <section class="card">
      <h1>{{ auth.isStaff() ? "Gestion de prestamos" : "Mis prestamos" }}</h1>
      <p class="muted">
        El detalle valida propiedad del recurso en servidor para evitar IDOR.
      </p>
      <p class="muted" *ngIf="!auth.isStaff() && !prestamos.length">
        Todavia no tienes prestamos. Una reserva aparecera aqui cuando el
        personal la apruebe y la convierta en prestamo.
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th *ngIf="auth.isStaff()">Solicitante</th>
              <th>Equipos</th>
              <th>Prestamo</th>
              <th>Compromiso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of prestamos">
              <td>{{ p.prestamo_id }}</td>
              <td *ngIf="auth.isStaff()">{{ p.solicitante || p.usuario }}</td>
              <td>{{ p.equipos }}</td>
              <td>{{ p.fecha_prestamo }}</td>
              <td>{{ p.fecha_compromiso }}</td>
              <td>{{ p.estado }}</td>
              <td>
                <div class="row-actions">
                  <button class="small-btn" (click)="ver(p.prestamo_id)">
                    Detalle</button
                  ><button
                    *ngIf="auth.isStaff() && !esFinal(p.estado)"
                    class="small-btn"
                    (click)="editar(p.prestamo_id)"
                  >
                    Editar</button
                  ><button
                    *ngIf="
                      auth.isStaff() &&
                      p.estado !== 'DEVUELTO' &&
                      p.estado !== 'CANCELADO'
                    "
                    class="small-btn danger-btn"
                    (click)="eliminar(p)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section class="card" *ngIf="detalle.length">
      <h2>Detalle del prestamo</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Salida</th>
              <th>Entrada</th>
              <th>Devolucion</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of detalle">
              <td>{{ d.codigo_equipo }} - {{ d.equipo }}</td>
              <td>{{ d.condicion_salida || "-" }}</td>
              <td>{{ d.condicion_entrada || "-" }}</td>
              <td>{{ d.fecha_devolucion || "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <p class="error" *ngIf="error && !auth.isStaff()">{{ error }}</p>`,
})
export class PrestamosComponent {
  prestamos: any[] = [];
  detalle: any[] = [];
  cuentas: any[] = [];
  equipos: any[] = [];
  editandoId: number | null = null;
  error = "";
  mensaje = "";
  estadosDisponibles = [
    "PENDIENTE",
    "ENTREGADO",
    "DEVUELTO",
    "VENCIDO",
    "CANCELADO",
  ];
  form: any = {
    cuentaId: 0,
    equipoId: 0,
    fechaCompromiso: "",
    fechaDevolucion: "",
    estado: "PENDIENTE",
    observaciones: "",
    condicionSalida: "",
    condicionEntrada: "",
  };
  constructor(
    private api: ApiService,
    public auth: AuthService,
  ) {
    if (this.auth.isStaff()) this.cargarCatalogos();
    this.cargar();
  }
  cargar() {
    this.error = "";
    const q = this.auth.isStaff()
      ? this.api.listarPrestamosGestion()
      : this.api.prestamosMios();
    q.subscribe({
      next: (d) => (this.prestamos = d),
      error: (e) =>
        (this.error = e?.error?.message || "Error al consultar prestamos."),
    });
  }
  cargarCatalogos() {
    this.api
      .listarCuentasPrestamo()
      .subscribe({ next: (d) => (this.cuentas = d) });
    this.api.buscarEquipos("").subscribe({ next: (d) => (this.equipos = d) });
  }
  ver(id: number) {
    this.error = "";
    this.api.obtenerPrestamo(id).subscribe({
      next: (d) => (this.detalle = d),
      error: (e) => {
        this.detalle = [];
        this.error =
          e?.error?.message || "No fue posible consultar el prestamo.";
      },
    });
  }
  nuevo() {
    this.editandoId = null;
    this.form = {
      cuentaId: 0,
      equipoId: 0,
      fechaCompromiso: "",
      fechaDevolucion: "",
      estado: "PENDIENTE",
      observaciones: "",
      condicionSalida: "",
      condicionEntrada: "",
    };
    this.detalle = [];
    this.error = "";
    this.mensaje = "";
    this.cargarCatalogos();
  }
  editar(id: number) {
    this.error = "";
    this.api.obtenerPrestamo(id).subscribe({
      next: (d) => {
        const p = d[0];
        if (!p) return;
        this.editandoId = id;
        this.form = {
          cuentaId: Number(p.cuenta_id),
          equipoId: Number(p.equipo_id),
          fechaCompromiso: this.toInput(p.fecha_compromiso),
          fechaDevolucion: this.toInput(p.fecha_devolucion),
          estado: p.estado,
          observaciones: p.observaciones || "",
          condicionSalida: p.condicion_salida || "",
          condicionEntrada: p.condicion_entrada || "",
        };
        this.detalle = d;
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      error: (e) =>
        (this.error =
          e?.error?.message || "No fue posible cargar el prestamo."),
    });
  }
  guardar() {
    this.error = "";
    this.mensaje = "";
    if (
      !this.form.cuentaId ||
      !this.form.equipoId ||
      !this.form.fechaCompromiso
    ) {
      this.error = "Selecciona solicitante, equipo y fecha compromiso.";
      return;
    }
    const q = this.editandoId
      ? this.api.actualizarPrestamo(this.editandoId, this.form)
      : this.api.crearPrestamo(this.form);
    q.subscribe({
      next: () => {
        const m = this.editandoId
          ? "Prestamo actualizado."
          : "Prestamo registrado.";
        this.nuevoConMensaje(m);
        this.cargar();
      },
      error: (e) =>
        (this.error =
          e?.error?.message || "No fue posible guardar el prestamo."),
    });
  }
  eliminar(p: any) {
    if (!confirm(`Cancelar el prestamo #${p.prestamo_id}?`)) return;
    this.error = "";
    this.api.eliminarPrestamo(p.prestamo_id).subscribe({
      next: () => {
        this.mensaje = "Prestamo cancelado.";
        this.cargar();
        this.cargarCatalogos();
      },
      error: (e) =>
        (this.error =
          e?.error?.message || "No fue posible cancelar el prestamo."),
    });
  }
  esFinal(estado: string) {
    return ["DEVUELTO", "CANCELADO"].includes(estado);
  }
  nuevoConMensaje(m: string) {
    this.editandoId = null;
    this.form = {
      cuentaId: 0,
      equipoId: 0,
      fechaCompromiso: "",
      fechaDevolucion: "",
      estado: "PENDIENTE",
      observaciones: "",
      condicionSalida: "",
      condicionEntrada: "",
    };
    this.detalle = [];
    this.mensaje = m;
    this.cargarCatalogos();
  }
  toInput(value: any) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
      return String(value).slice(0, 16).replace(" ", "T");
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
