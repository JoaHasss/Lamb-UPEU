import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { mensajeError } from '../../core/http/mensaje-error';
import { MovilidadesEstudiantilesResponse } from './movilidades-estudiantiles.model';
import { MovilidadesEstudiantilesService } from './movilidades-estudiantiles-service';

import { SinGuion } from '../../core/sin-guion.pipe';
@Component({
  selector: 'app-movilidades-estudiantiles-list',
  standalone: true,
  imports: [SinGuion, RouterLink],
  templateUrl: './movilidades-estudiantiles-list.html',
})
export class MovilidadesEstudiantilesList {
  private readonly servicio = inject(MovilidadesEstudiantilesService);
  protected readonly auth = inject(AuthService);

  protected readonly items = signal<MovilidadesEstudiantilesResponse[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  constructor() {
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


}
