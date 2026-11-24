import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { OpcionesFinanzasMatricula } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { CuentasResponse } from './cuentas.model';
import { CuentasService } from './cuentas-service';

@Component({
  selector: 'app-cuentas-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cuentas-list.html',
})
export class CuentasList {
  private readonly servicio = inject(CuentasService);
  protected readonly auth = inject(AuthService);

  protected readonly items = signal<CuentasResponse[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);
  // idPersona -> "Apellidos, Nombres"
  protected readonly personas = signal<Map<number, string>>(new Map());

  constructor() {
    const opciones = inject(OpcionesFinanzasMatricula);
    opciones.personas().subscribe((p) => this.personas.set(new Map(p.map((x) => [x.id, `${x.apellidos}, ${x.nombres}`]))));
    this.cargar();
  }

  cargar() {
    this.error.set(null);
    this.servicio.listar().subscribe({
      next: (data) => this.items.set(data),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar la lista.')),
    });
  }

  protected persona(id: number): string {
    return this.personas().get(id) ?? `Persona ${id}`;
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
