import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/api.service";
@Component({
  selector: "app-incidencias",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: ` <section class="card">
      <h1>Incidencias</h1>
      <p class="muted">
        El contenido se renderiza como texto; Angular escapa HTML y JavaScript
        automaticamente.
      </p>
      <div class="grid-form">
        <label
          >Equipo ID<input
            type="number"
            min="1"
            [(ngModel)]="form.equipoId" /></label
        ><label
          >Tipo<select [(ngModel)]="form.tipo">
            <option>FALLA</option>
            <option>DANO</option>
            <option>PERDIDA</option>
            <option>OTRO</option>
          </select></label
        >
      </div>
      <label
        >Descripcion<textarea
          rows="4"
          maxlength="1000"
          [(ngModel)]="form.descripcion"
        ></textarea></label
      ><button (click)="crear()">Registrar incidencia</button>
      <p class="error" *ngIf="error">{{ error }}</p>
      <p class="success" *ngIf="mensaje">{{ mensaje }}</p>
    </section>
    <section class="card">
      <h2>Incidencias visibles para mi rol</h2>
      <article class="incident" *ngFor="let i of incidencias">
        <strong>#{{ i.incidencia_id }} · {{ i.codigo }} · {{ i.tipo }}</strong>
        <p>{{ i.descripcion }}</p>
        <small>{{ i.usuario }} · {{ i.estado }} · {{ i.creado_en }}</small>
      </article>
    </section>`,
})
export class IncidenciasComponent {
  incidencias: any[] = [];
  form = { equipoId: 1, tipo: "FALLA", descripcion: "" };
  error = "";
  mensaje = "";
  constructor(private api: ApiService) {
    this.cargar();
  }
  cargar() {
    this.api
      .listarIncidencias()
      .subscribe({
        next: (d) => (this.incidencias = d),
        error: (e) =>
          (this.error = e?.error?.message || "Error al consultar incidencias."),
      });
  }
  crear() {
    this.error = "";
    this.mensaje = "";
    if (!this.form.equipoId || this.form.descripcion.trim().length < 5) {
      this.error = "Selecciona un equipo y captura al menos 5 caracteres.";
      return;
    }
    this.api
      .crearIncidencia({
        ...this.form,
        descripcion: this.form.descripcion.trim(),
      })
      .subscribe({
        next: () => {
          this.mensaje = "Incidencia registrada.";
          this.form.descripcion = "";
          this.cargar();
        },
        error: (e) =>
          (this.error = e?.error?.message || "No fue posible registrar."),
      });
  }
}
