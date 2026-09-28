import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { EquiposComponent } from './pages/equipos/equipos.component';
import { PrestamosComponent } from './pages/prestamos/prestamos.component';
import { ReservasComponent } from './pages/reservas/reservas.component';
import { IncidenciasComponent } from './pages/incidencias/incidencias.component';
import { AuditoriaComponent } from './pages/auditoria/auditoria.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { authGuard, adminGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'equipos', component: EquiposComponent, canActivate: [authGuard] },
  { path: 'prestamos', component: PrestamosComponent, canActivate: [authGuard] },
  { path: 'reservas', component: ReservasComponent, canActivate: [authGuard] },
  { path: 'incidencias', component: IncidenciasComponent, canActivate: [authGuard] },
  { path: 'auditoria', component: AuditoriaComponent, canActivate: [adminGuard] },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [adminGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
