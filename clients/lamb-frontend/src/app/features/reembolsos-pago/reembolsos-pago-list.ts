import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { OpcionesFinanzasMatricula, SolicitudDevolucionOpcion } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { ReembolsosPagoResponse } from './reembolsos-pago.model';
import { ReembolsosPagoService } from './reembolsos-pago-service';

@Component({
  selector: 'app-reembolsos-pago-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reembolsos-pago-list.html',
})
export class ReembolsosPagoList {
  private readonly servicio = inject(ReembolsosPagoService);
  protected readonly auth = inject(AuthService);

  protected readonly items = signal<ReembolsosPagoResponse[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly solicitudes = signal<Map<number, SolicitudDevolucionOpcion>>(new Map());
  // idCuentaEstudiante -> idPersona
  protected readonly personas = signal<Map<number, number>>(new Map());
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  constructor() {
    const opciones = inject(OpcionesFinanzasMatricula);
    opciones.solicitudesDevolucion().subscribe((s) => this.solicitudes.set(new Map(s.map((x) => [x.id, x]))));
    opciones.cuentasEstudiante().subscribe((c) => this.personas.set(new Map(c.map((x) => [x.id, x.idPersona]))));
    this.cargar();
  }

  cargar() {
    this.error.set(null);
    this.servicio.listar().subscribe({
      next: (data) => this.items.set(data),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar la lista.')),
    });
  }

  private accion(obs: Observable<unknown>) {
    this.errorAccion.set(null);
    this.exito.set(null);
    obs.subscribe({
      next: () => {
        this.exito.set('Operación realizada.');
        this.cargar();
      },
      error: (err) => this.errorAccion.set(mensajeError(err, 'No se pudo completar la operación.')),
    });
  }

  // Pide confirmacion; si otro registro lo usa, el backend responde 409 y se muestra su mensaje
  protected eliminar(id: number): void {
    if (!confirm(`¿Eliminar el registro #${id}?`)) {
      return;
    }
    this.errorAccion.set(null);
    this.exito.set(null);
    this.servicio.eliminar(id).subscribe({
      next: () => {
        this.exito.set(`Registro #${id} eliminado.`);
        this.cargar();
      },
      error: (err) => this.errorAccion.set(mensajeError(err, 'No se pudo eliminar el registro.')),
    });
  }
}
