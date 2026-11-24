import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { mensajeError } from '../../core/http/mensaje-error';
import { ModalidadesMatriculaResponse } from './modalidades-matricula.model';
import { ModalidadesMatriculaService } from './modalidades-matricula-service';

import { SiNo } from '../../core/si-no.pipe';
@Component({
  selector: 'app-modalidades-matricula-list',
  standalone: true,
  imports: [SiNo, RouterLink],
  templateUrl: './modalidades-matricula-list.html',
})
export class ModalidadesMatriculaList {
  private readonly servicio = inject(ModalidadesMatriculaService);
  protected readonly auth = inject(AuthService);

  protected readonly items = signal<ModalidadesMatriculaResponse[]>([]);
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

  eliminar(id: number) {
    this.accion(this.servicio.eliminar(id));
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
