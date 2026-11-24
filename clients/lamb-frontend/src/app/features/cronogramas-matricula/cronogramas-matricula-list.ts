import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { mensajeError } from '../../core/http/mensaje-error';
import { CronogramasMatriculaResponse } from './cronogramas-matricula.model';
import { CronogramasMatriculaService } from './cronogramas-matricula-service';

@Component({
  selector: 'app-cronogramas-matricula-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cronogramas-matricula-list.html',
})
export class CronogramasMatriculaList {
  private readonly servicio = inject(CronogramasMatriculaService);
  protected readonly auth = inject(AuthService);

  protected readonly items = signal<CronogramasMatriculaResponse[]>([]);
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
