import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcionesFinanzasMatricula, PersonaOpcion, PagoOpcion } from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { SinGuion } from '../../core/sin-guion.pipe';
import { SolicitudesDevolucionRequest } from './solicitudes-devolucion.model';
import { SolicitudesDevolucionService } from './solicitudes-devolucion-service';

@Component({
  selector: 'app-solicitudes-devolucion-form',
  standalone: true,
  imports: [ReactiveFormsModule, SinGuion],
  templateUrl: './solicitudes-devolucion-form.html',
})
export class SolicitudesDevolucionForm {
  private readonly servicio = inject(SolicitudesDevolucionService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');
  protected readonly personas = signal<PersonaOpcion[]>([]);
  protected readonly pagos = signal<PagoOpcion[]>([]);
  // Pago de la solicitud que se esta editando (puede estar ya REEMBOLSADO)
  private readonly idPagoOriginal = signal<number | null>(null);
  // Solo se devuelve dinero cobrado: pagos APROBADO (+ el pago original al editar)
  protected readonly pagosDevolvibles = computed(() =>
    this.pagos().filter((p) => p.estado === 'APROBADO' || p.id === this.idPagoOriginal()),
  );

  protected readonly form = this.fb.group({
      idPago: [null as number | null, [Validators.required]],
      motivo: ['', [Validators.required]],
      montoSolicitado: [null as number | null, [Validators.required, Validators.min(0.01)]],
      estado: ['PENDIENTE', [Validators.required]],
      fecha: ['', [Validators.required]],
  });

  constructor() {
    const opciones = inject(OpcionesFinanzasMatricula);
    opciones.personas().subscribe((p) => this.personas.set(p));
    opciones.pagos().subscribe((p) => this.pagos.set(p));
    if (this.id) {
      this.servicio.obtener(Number(this.id)).subscribe({
        next: (data) => {
          this.idPagoOriginal.set(data.idPago);
          this.form.patchValue({ ...data, fecha: data.fecha?.slice(0, 16) ?? '' });
        },
        error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar el registro.')),
      });
    }
  }

  protected nombrePersona(id: number): string {
    const p = this.personas().find((x) => x.id === id);
    return p ? `${p.apellidos}, ${p.nombres}` : `Persona ${id}`;
  }

  // Al elegir el pago se propone devolver su monto completo
  protected alElegirPago(): void {
    const pago = this.pagos().find((p) => p.id === this.form.value.idPago);
    if (pago) {
      this.form.patchValue({ montoSolicitado: pago.monto });
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    const valores = this.form.getRawValue();
    const request = { ...valores, fecha: new Date(valores.fecha!).toISOString() } as SolicitudesDevolucionRequest;
    const obs = this.id
      ? this.servicio.actualizar(Number(this.id), request)
      : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/solicitudes-devolucion']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
