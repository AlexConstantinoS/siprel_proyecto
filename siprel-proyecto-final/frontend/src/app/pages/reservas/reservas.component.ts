import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-reservas",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <section class="card" *ngIf="!auth.isStaff()">
      <h1>Reservar equipo</h1>
      <p class="muted">
        Selecciona el equipo por codigo y nombre. No necesitas conocer su ID
        interno.
      </p>
      <div class="grid-form">
        <label
          >Equipo
          <select [(ngModel)]="form.equipoId">
            <option [ngValue]="0">Seleccione un equipo...</option>
            <option *ngFor="let e of equipos" [ngValue]="e.equipo_id">
              {{ e.codigo }} - {{ e.nombre }} · {{ e.marca || "Sin marca" }} ·
              {{ e.ubicacion || "Sin ubicacion" }}
            </option>
          </select>
        </label>
        <label
          >Inicio<input type="datetime-local" [(ngModel)]="form.fechaInicio"
        /></label>
        <label
          >Fin<input type="datetime-local" [(ngModel)]="form.fechaFin"
        /></label>
        <label>Motivo<input maxlength="300" [(ngModel)]="form.motivo" /></label>
      </div>
      <p class="error" *ngIf="error">{{ error }}</p>
      <p class="success" *ngIf="mensaje">{{ mensaje }}</p>
      <button (click)="crear()">Crear reserva</button>
    </section>

    <section class="card" *ngIf="!auth.isStaff()">
      <h2>Mis reservas</h2>
      <p class="muted">
        Una reserva pendiente todavia no es un prestamo. Cuando sea aprobada y
        convertida por el personal, aparecera tambien en Mis prestamos.
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Equipo</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reservas">
              <td>{{ r.reserva_id }}</td>
              <td>{{ r.codigo }} - {{ r.equipo }}</td>
              <td>{{ r.fecha_inicio | date: "dd/MM/yyyy HH:mm" }}</td>
              <td>{{ r.fecha_fin | date: "dd/MM/yyyy HH:mm" }}</td>
              <td>{{ r.motivo || "-" }}</td>
              <td>{{ r.estado }}</td>
              <td>
                <button
                  class="small-btn danger-btn"
                  *ngIf="r.estado === 'PENDIENTE' || r.estado === 'APROBADA'"
                  (click)="cancelar(r.reserva_id)"
                >
                  Cancelar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card" *ngIf="auth.isStaff()">
      <div class="section-head">
        <div>
          <h1>Gestion de reservas</h1>
          <p class="muted">
            Aqui aparecen las solicitudes de todos los usuarios. Aprueba la
            reserva y despues genera el prestamo para que aparezca en Mis
            prestamos del solicitante.
          </p>
        </div>
        <button class="secondary" (click)="cargar()">Actualizar</button>
      </div>
      <p class="error" *ngIf="error">{{ error }}</p>
      <p class="success" *ngIf="mensaje">{{ mensaje }}</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Solicitante</th>
              <th>Equipo</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reservas">
              <td>{{ r.reserva_id }}</td>
              <td>
                {{ r.solicitante }}<br /><span class="muted">{{
                  r.usuario
                }}</span>
              </td>
              <td>
                {{ r.codigo }} - {{ r.equipo }}<br /><span class="muted">{{
                  r.ubicacion || ""
                }}</span>
              </td>
              <td>{{ r.fecha_inicio | date: "dd/MM/yyyy HH:mm" }}</td>
              <td>{{ r.fecha_fin | date: "dd/MM/yyyy HH:mm" }}</td>
              <td>{{ r.motivo || "-" }}</td>
              <td>{{ r.estado }}</td>
              <td>
                <div class="row-actions">
                  <button
                    class="small-btn"
                    *ngIf="r.estado === 'PENDIENTE'"
                    (click)="cambiarEstado(r.reserva_id, 'APROBADA')"
                  >
                    Aprobar
                  </button>
                  <button
                    class="small-btn danger-btn"
                    *ngIf="r.estado === 'PENDIENTE' || r.estado === 'APROBADA'"
                    (click)="cambiarEstado(r.reserva_id, 'RECHAZADA')"
                  >
                    Rechazar
                  </button>
                  <button
                    class="small-btn"
                    *ngIf="r.estado === 'APROBADA'"
                    (click)="convertir(r)"
                  >
                    Generar prestamo
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`,
})
export class ReservasComponent {
  reservas: any[] = [];
  equipos: any[] = [];
  error = "";
  mensaje = "";
  form = { equipoId: 0, fechaInicio: "", fechaFin: "", motivo: "" };

  constructor(
    private api: ApiService,
    public auth: AuthService,
  ) {
    if (!this.auth.isStaff()) this.cargarEquipos();
    this.cargar();
  }

  cargarEquipos() {
    this.api.buscarEquipos("").subscribe({
      next: (d) => (this.equipos = d.filter((e) => e.estado === "DISPONIBLE")),
      error: (e) =>
        (this.error =
          e?.error?.message || "No fue posible cargar los equipos."),
    });
  }

  cargar() {
    this.error = "";
    const q = this.auth.isStaff()
      ? this.api.listarReservasGestion()
      : this.api.reservasMias();
    q.subscribe({
      next: (d) => (this.reservas = d),
      error: (e) =>
        (this.error = e?.error?.message || "Error al consultar reservas."),
    });
  }

  crear() {
    this.error = "";
    this.mensaje = "";
    if (!this.form.equipoId || !this.form.fechaInicio || !this.form.fechaFin) {
      this.error = "Equipo, inicio y fin son obligatorios.";
      return;
    }
    if (new Date(this.form.fechaFin) <= new Date(this.form.fechaInicio)) {
      this.error = "La fecha final debe ser posterior al inicio.";
      return;
    }
    this.api.crearReserva(this.form).subscribe({
      next: () => {
        this.mensaje = "Reserva registrada y enviada para aprobacion.";
        this.form = { equipoId: 0, fechaInicio: "", fechaFin: "", motivo: "" };
        this.cargar();
        this.cargarEquipos();
      },
      error: (e) =>
        (this.error = e?.error?.message || "No fue posible crear la reserva."),
    });
  }

  cambiarEstado(id: number, estado: "APROBADA" | "RECHAZADA") {
    const texto = estado === "APROBADA" ? "aprobar" : "rechazar";
    if (!confirm(`¿Deseas ${texto} la reserva #${id}?`)) return;
    this.error = "";
    this.mensaje = "";
    this.api.cambiarEstadoReserva(id, estado).subscribe({
      next: () => {
        this.mensaje = `Reserva ${estado.toLowerCase()}.`;
        this.cargar();
      },
      error: (e) =>
        (this.error =
          e?.error?.message || "No fue posible actualizar la reserva."),
    });
  }

  convertir(r: any) {
    if (
      !confirm(
        `¿Generar un prestamo PENDIENTE para ${r.solicitante} con ${r.codigo} - ${r.equipo}?`,
      )
    )
      return;
    this.error = "";
    this.mensaje = "";
    this.api
      .convertirReservaAPrestamo(r.reserva_id, {
        observaciones: `Generado desde reserva #${r.reserva_id}`,
      })
      .subscribe({
        next: (x) => {
          this.mensaje = `Prestamo #${x.prestamo_id} generado. Ya aparecera en Mis prestamos del solicitante.`;
          this.cargar();
        },
        error: (e) =>
          (this.error =
            e?.error?.message || "No fue posible generar el prestamo."),
      });
  }

  cancelar(id: number) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    this.api.cancelarReserva(id).subscribe({
      next: () => {
        this.mensaje = "Reserva cancelada.";
        this.cargar();
        this.cargarEquipos();
      },
      error: (e) =>
        (this.error = e?.error?.message || "No fue posible cancelar."),
    });
  }
}
