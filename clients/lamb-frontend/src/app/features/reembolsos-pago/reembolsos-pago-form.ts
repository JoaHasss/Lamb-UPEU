import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CuentaEstudianteOpcion,
  OpcionesFinanzasMatricula,
  SolicitudDevolucionOpcion,
} from '../../core/catalogos/opciones-finanzas-matricula';
import { mensajeError } from '../../core/http/mensaje-error';
import { SinGuion } from '../../core/sin-guion.pipe';
import { PagoService } from '../pagos/pago-service';
import { ReembolsosPagoRequest } from './reembolsos-pago.model';
import { ReembolsosPagoService } from './reembolsos-pago-service';

@Component({
  selector: 'app-reembolsos-pago-form',
  standalone: true,
  imports: [ReactiveFormsModule, SinGuion],
  templateUrl: './reembolsos-pago-form.html',
})
export class ReembolsosPagoForm {
  private readonly servicio = inject(ReembolsosPagoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly error = signal<string | null>(null);
  protected readonly id = this.ruta.snapshot.paramMap.get('id');
  protected readonly solicitudes = signal<SolicitudDevolucionOpcion[]>([]);
  protected readonly cuentas = signal<CuentaEstudianteOpcion[]>([]);
  // idPago -> idPersona, para proponer la cuenta del estudiante que pago
  private readonly personaDePago = new Map<number, number>();

  protected readonly form = this.fb.group({
      idSolicitudDevolucion: [null as number | null, [Validators.required]],
      idCuentaEstudiante: [null as number | null, [Validators.required]],
      montoReembolsado: [null as number | null, [Validators.required, Validators.min(0.01)]],
      fecha: ['', [Validators.required]],
  });

  constructor() {
    const opciones = inject(OpcionesFinanzasMatricula);
    opciones.solicitudesDevolucion().subscribe((s) => this.solicitudes.set(s));
    opciones.cuentasEstudiante().subscribe((c) => this.cuentas.set(c));
    inject(PagoService).listar().subscribe((pagos) => pagos.forEach((p) => this.personaDePago.set(p.id, p.idPersona)));
    if (this.id) {
      this.servicio.obtener(Number(this.id)).subscribe({
        next: (data) => this.form.patchValue({ ...data, fecha: data.fecha?.slice(0, 16) ?? '' }),
        error: (err) => this.error.set(mensajeError(err, 'No se pudo cargar el registro.')),
      });
    }
  }

  // Al elegir la solicitud se proponen el monto solicitado y la cuenta del estudiante que pago
  protected alElegirSolicitud(): void {
    const solicitud = this.solicitudes().find((s) => s.id === this.form.value.idSolicitudDevolucion);
    if (!solicitud) {
      return;
    }
    const idPersona = this.personaDePago.get(solicitud.idPago);
    const cuenta = this.cuentas().find((c) => c.idPersona === idPersona);
    this.form.patchValue({
      montoReembolsado: solicitud.montoSolicitado,
      idCuentaEstudiante: cuenta?.id ?? this.form.value.idCuentaEstudiante ?? null,
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    const valores = this.form.getRawValue();
    // datetime-local no trae zona: el backend espera un Instant (ISO con Z)
    const request = { ...valores, fecha: new Date(valores.fecha!).toISOString() } as ReembolsosPagoRequest;
    const obs = this.id
      ? this.servicio.actualizar(Number(this.id), request)
      : this.servicio.crear(request);
    obs.subscribe({
      next: () => this.router.navigate(['/reembolsos-pago']),
      error: (err) => this.error.set(mensajeError(err, 'No se pudo guardar el registro.')),
    });
  }
}
