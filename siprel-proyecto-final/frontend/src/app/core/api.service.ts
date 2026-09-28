import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  buscarEquipos(buscar = '') { return this.http.get<any[]>('/api/v1/equipos', { params: { buscar } }); }
  listarCategoriasEquipo() { return this.http.get<any[]>('/api/v1/equipos/categorias'); }
  listarEquiposGestion(buscar = '', incluirInactivos = false) { return this.http.get<any[]>('/api/v1/equipos/gestion', { params: { buscar, incluirInactivos } }); }
  crearEquipo(data: any) { return this.http.post<any>('/api/v1/equipos', data); }
  actualizarEquipo(id: number, data: any) { return this.http.put<any>(`/api/v1/equipos/${id}`, data); }
  eliminarEquipo(id: number) { return this.http.delete<any>(`/api/v1/equipos/${id}`); }

  prestamosMios() { return this.http.get<any[]>('/api/v1/prestamos/mios'); }
  listarPrestamosGestion() { return this.http.get<any[]>('/api/v1/prestamos/gestion'); }
  listarCuentasPrestamo() { return this.http.get<any[]>('/api/v1/prestamos/cuentas'); }
  obtenerPrestamo(id: number) { return this.http.get<any[]>(`/api/v1/prestamos/${id}`); }
  crearPrestamo(data: any) { return this.http.post<any>('/api/v1/prestamos', data); }
  actualizarPrestamo(id: number, data: any) { return this.http.put<any[]>(`/api/v1/prestamos/${id}`, data); }
  eliminarPrestamo(id: number) { return this.http.delete<any>(`/api/v1/prestamos/${id}`); }

  reservasMias() { return this.http.get<any[]>('/api/v1/reservas/mias'); }
  listarReservasGestion() { return this.http.get<any[]>('/api/v1/reservas/gestion'); }
  crearReserva(data: any) { return this.http.post<any>('/api/v1/reservas', data); }
  cambiarEstadoReserva(id: number, estado: 'APROBADA' | 'RECHAZADA') { return this.http.patch<any>(`/api/v1/reservas/${id}/estado`, { estado }); }
  convertirReservaAPrestamo(id: number, data: { condicionSalida?: string; observaciones?: string } = {}) { return this.http.post<any>(`/api/v1/reservas/${id}/convertir-prestamo`, data); }
  cancelarReserva(id: number) { return this.http.delete<any>(`/api/v1/reservas/${id}`); }
  listarIncidencias() { return this.http.get<any[]>('/api/v1/incidencias'); }
  crearIncidencia(data: { equipoId: number; tipo: string; descripcion: string }) { return this.http.post('/api/v1/incidencias', data); }
  listarAuditoria() { return this.http.get<any[]>('/api/v1/admin/auditoria'); }
  listarRoles() { return this.http.get<any[]>('/api/v1/admin/usuarios/roles'); }
  listarUsuarios(incluirInactivos = false) { return this.http.get<any[]>('/api/v1/admin/usuarios', { params: { incluirInactivos } }); }
  obtenerUsuario(id: number) { return this.http.get<any>(`/api/v1/admin/usuarios/${id}`); }
  crearUsuario(data: any) { return this.http.post<any>('/api/v1/admin/usuarios', data); }
  actualizarUsuario(id: number, data: any) { return this.http.put<any>(`/api/v1/admin/usuarios/${id}`, data); }
  eliminarUsuario(id: number) { return this.http.delete<any>(`/api/v1/admin/usuarios/${id}`); }
}
