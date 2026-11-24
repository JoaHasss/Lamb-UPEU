import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CronogramaOpcion, OpcionesFinanzasMatricula } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { VariacionesMatriculaRequest } from './variaciones-matricula.model';
import { VariacionesMatriculaService } from './variaciones-matricula-service';

@Component({
  selector: 'app-variaciones-matricula-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './variaciones-matricula-form.html',
})
export class VariacionesMatriculaForm {
  private readonly servicio = inject(VariacionesMatriculaService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly cronogramas = signal<CronogramaOpcion[]>([]);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');

  protected readonly form = this.fb.group({
      idCronograma: [null as number | null, [Validators.required]],
      tipo: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      descripcion: ['', []],
  });

  constructor() {
    inject(OpcionesFinanzasMatricula).cronogramas().subscribe((c) => this.cronogramas.set(c));
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
    const request = this.form.getRawValue() as VariacionesMatriculaRequest;
    const obs = this.id
      ? this.servicio.actualizar(Number(this.id), request)
      : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/variaciones-matricula']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
