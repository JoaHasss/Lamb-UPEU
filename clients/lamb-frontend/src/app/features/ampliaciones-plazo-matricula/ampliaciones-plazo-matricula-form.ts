import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CronogramaOpcion, OpcionesFinanzasMatricula } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { AmpliacionesPlazoMatriculaRequest } from './ampliaciones-plazo-matricula.model';
import { AmpliacionesPlazoMatriculaService } from './ampliaciones-plazo-matricula-service';

@Component({
  selector: 'app-ampliaciones-plazo-matricula-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ampliaciones-plazo-matricula-form.html',
})
export class AmpliacionesPlazoMatriculaForm {
  private readonly servicio = inject(AmpliacionesPlazoMatriculaService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly cronogramas = signal<CronogramaOpcion[]>([]);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');

  protected readonly form = this.fb.group({
      idCronograma: [null as number | null, [Validators.required]],
      fechaAmpliada: ['', [Validators.required]],
      motivo: ['', []],
      autorizadoPor: ['', []],
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
    const request = this.form.getRawValue() as AmpliacionesPlazoMatriculaRequest;
    const obs = this.id
      ? this.servicio.actualizar(Number(this.id), request)
      : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/ampliaciones-plazo-matricula']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
