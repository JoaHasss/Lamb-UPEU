import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriaConceptoOpcion, OpcionesFinanzasMatricula } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { ConceptosPagoRequest } from './conceptos-pago.model';
import { ConceptosPagoService } from './conceptos-pago-service';

@Component({
  selector: 'app-conceptos-pago-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './conceptos-pago-form.html',
})
export class ConceptosPagoForm {
  private readonly servicio = inject(ConceptosPagoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');
  protected readonly categorias = signal<CategoriaConceptoOpcion[]>([]);

  protected readonly form = this.fb.group({
      idCategoria: [null as number | null, [Validators.required]],
      nombre: ['', [Validators.required]],
      monto: [null as number | null, [Validators.required, Validators.min(0)]],
      vigenciaDesde: ['', [Validators.required]],
      vigenciaHasta: [null as string | null],
  });

  constructor() {
    inject(OpcionesFinanzasMatricula).categoriasConcepto().subscribe((c) => this.categorias.set(c));
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
    const request = { ...valores, vigenciaHasta: valores.vigenciaHasta || null } as ConceptosPagoRequest;
    const obs = this.id
      ? this.servicio.actualizar(Number(this.id), request)
      : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/conceptos-pago']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
