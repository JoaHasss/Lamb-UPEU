import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcionesFinanzasMatricula, PersonaOpcion } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { CuentasRequest } from './cuentas.model';
import { CuentasService } from './cuentas-service';

@Component({
  selector: 'app-cuentas-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cuentas-form.html',
})
export class CuentasForm {
  private readonly servicio = inject(CuentasService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');
  protected readonly personas = signal<PersonaOpcion[]>([]);

  protected readonly form = this.fb.group({
      idPersona: [null as number | null, [Validators.required]],
      saldoActual: [0 as number | null, [Validators.required]],
  });

  constructor() {
    const opciones = inject(OpcionesFinanzasMatricula);
    opciones.personas().subscribe((p) => this.personas.set(p));
    if (this.id) {
      this.servicio.obtener(Number(this.id)).subscribe({
        next: (data) => this.form.patchValue(data),
        error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar el registro.')),
      });
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    const valores = this.form.getRawValue();
    const request = valores as CuentasRequest;
    const obs = this.id
      ? this.servicio.actualizar(Number(this.id), request)
      : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/cuentas']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
