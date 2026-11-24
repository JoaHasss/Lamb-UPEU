import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { mensajeError } from '../../core/http/mensaje-error';
import { PeriodosAcademicosResponse } from './periodos-academicos.model';
import { PeriodosAcademicosService } from './periodos-academicos-service';

import { SinGuion } from '../../core/sin-guion.pipe';
@Component({
  selector: 'app-periodos-academicos-list',
  standalone: true,
  imports: [SinGuion, RouterLink],
  templateUrl: './periodos-academicos-list.html',
})
export class PeriodosAcademicosList {
  private readonly servicio = inject(PeriodosAcademicosService);
  protected readonly auth = inject(AuthService);
  protected readonly items = signal<PeriodosAcademicosResponse[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  constructor() { this.cargar(); }

  cargar() {
    this.error.set(null);
    this.servicio.listar().subscribe({
      next: (data) => this.items.set(data),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar la lista.')),
    });
  }

  eliminar(id: number) {
    this.accion(this.servicio.eliminar(id));
  }

  private accion(obs: Observable<unknown>) {
    this.errorAccion.set(null);
    this.exito.set(null);
    obs.subscribe({
      next: () => { this.exito.set('Operación realizada.'); this.cargar(); },
      error: (err) => this.errorAccion.set(mensajeError(err, 'No se pudo completar la operación.')),
    });
  }
}
