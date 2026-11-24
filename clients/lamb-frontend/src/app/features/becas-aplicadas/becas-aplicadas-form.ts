import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcionesFinanzasMatricula, PersonaOpcion, TipoBecaOpcion } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { BecasAplicadasRequest } from './becas-aplicadas.model';
import { BecasAplicadasService } from './becas-aplicadas-service';

@Component({
  selector: 'app-becas-aplicadas-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './becas-aplicadas-form.html',
})
export class BecasAplicadasForm {
  private readonly servicio = inject(BecasAplicadasService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');
  protected readonly personas = signal<PersonaOpcion[]>([]);
  protected readonly tiposBeca = signal<TipoBecaOpcion[]>([]);

  protected readonly form = this.fb.group({
      idPersona: [null as number | null, [Validators.required]],
      idTipoBeca: [null as number | null, [Validators.required]],
      porcentaje: [null as number | null, [Validators.required, Validators.min(1), Validators.max(100)]],
      fechaInicio: ['', [Validators.required]],
  });

  constructor() {
    const opciones = inject(OpcionesFinanzasMatricula);
    opciones.personas().subscribe((p) => this.personas.set(p));
    opciones.tiposBeca().subscribe((t) => this.tiposBeca.set(t));
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
    const request = valores as BecasAplicadasRequest;
    const obs = this.id
      ? this.servicio.actualizar(Number(this.id), request)
      : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/becas-aplicadas']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
