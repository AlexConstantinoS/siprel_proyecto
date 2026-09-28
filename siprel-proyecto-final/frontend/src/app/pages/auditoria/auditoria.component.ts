import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ApiService } from "../../core/api.service";
@Component({
  selector: "app-auditoria",
  standalone: true,
  imports: [CommonModule],
  template: `<section class="card">
    <h1>Bitacora de seguridad</h1>
    <p class="muted">
      Acceso exclusivo ADMIN. Registra autenticacion, operaciones
      administrativas y accesos denegados sin guardar contrasenas ni tokens.
    </p>
    <p class="error" *ngIf="error">{{ error }}</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Accion</th>
            <th>Detalle</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let l of logs">
            <td>{{ l.fecha_hora }}</td>
            <td>{{ l.usuario || "-" }}</td>
            <td>{{ l.accion }}</td>
            <td>{{ l.detalle }}</td>
            <td>{{ l.ip }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>`,
})
export class AuditoriaComponent {
  logs: any[] = [];
  error = "";
  constructor(private api: ApiService) {
    this.api
      .listarAuditoria()
      .subscribe({
        next: (d) => (this.logs = d),
        error: (e) =>
          (this.error =
            e?.error?.message || "No fue posible leer la auditoria."),
      });
  }
}
