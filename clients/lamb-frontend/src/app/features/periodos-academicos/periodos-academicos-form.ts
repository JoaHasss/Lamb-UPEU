import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { mensajeError } from '../../core/http/mensaje-error';
import { EstadoPeriodo, PeriodosAcademicosRequest } from './periodos-academicos.model';
import { PeriodosAcademicosService } from './periodos-academicos-service';
import { TiposPeriodoResponse } from '../tipos-periodo/tipos-periodo.model';
import { TiposPeriodoService } from '../tipos-periodo/tipos-periodo-service';

import { SinGuion } from '../../core/sin-guion.pipe';
@Component({
  selector: 'app-periodos-academicos-form',
  standalone: true,
  imports: [SinGuion, ReactiveFormsModule],
  templateUrl: './periodos-academicos-form.html',
})
export class PeriodosAcademicosForm {
  private readonly servicio = inject(PeriodosAcademicosService);
  private readonly tiposPeriodoServicio = inject(TiposPeriodoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');
  protected readonly tiposPeriodo = signal<TiposPeriodoResponse[]>([]);
  protected readonly estados: EstadoPeriodo[] = ['PLANIFICADO', 'EN_CURSO', 'CERRADO'];

  protected readonly form = this.fb.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    idTipoPeriodo: [null as number | null, [Validators.required]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
    estado: ['PLANIFICADO' as EstadoPeriodo, [Validators.required]],
  });

  constructor() {
    this.tiposPeriodoServicio.listar().subscribe({
      next: (data) => this.tiposPeriodo.set(data),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar los tipos de periodo.')),
    });

    if (this.id) {
      this.servicio.obtener(Number(this.id)).subscribe({
        next: (data) => this.form.patchValue(data),
        error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar el registro.')),
      });
    }
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.error.set(null);
    const request = this.form.getRawValue() as PeriodosAcademicosRequest;
    const obs = this.id ? this.servicio.actualizar(Number(this.id), request) : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/periodos-academicos']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
