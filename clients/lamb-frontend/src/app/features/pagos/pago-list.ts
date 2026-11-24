import { mensajeError } from '../../core/http/mensaje-error';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth-service';
import { MatriculaService } from '../matriculas/matricula-service';
import { MatriculaResponse } from '../matriculas/matricula.model';
import { PagoService } from './pago-service';
import { EstadoPago, PagoResponse } from './pago.model';

import { SinGuion } from '../../core/sin-guion.pipe';
// Que significa cada estado y que sigue, para el panel de detalles
const AYUDA_ESTADO: Record<EstadoPago, string> = {
  PENDIENTE: 'Cargo generado y aun sin pagar. Usa "Pagar" para cobrarlo con Mercado Pago.',
  EN_PROCESO: 'Hay un intento de pago esperando resultado o validacion (Aceptar / Rechazar).',
  APROBADO: 'Pago cobrado. Si viene de una matricula, la matricula queda confirmada.',
  RECHAZADO: 'El cobro no se completo. Si era de una matricula, esta puede anularse por impago.',
  REEMBOLSADO: 'El pago se devolvio al estudiante (solo registrado en LAMB).',
};

@Component({
  selector: 'app-pago-list',
  imports: [SinGuion, RouterLink],
  templateUrl: './pago-list.html',
  styles: `
    .detalle td { background: #f7f8fc; padding: 1rem 1.25rem; }
    .detalle-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem 2rem; }
    .detalle h4 { margin: 0 0 .5rem; font-size: .95rem; }
    .detalle dl { display: grid; grid-template-columns: max-content 1fr; gap: .25rem .75rem; margin: 0; }
    .detalle dt { color: #666; }
    .detalle dd { margin: 0; }
    .detalle .ayuda { margin: .75rem 0 0; color: #444; }
  `,
})
export class PagoList {
  private readonly service = inject(PagoService);
  private readonly matriculaService = inject(MatriculaService);
  protected readonly auth = inject(AuthService);

  protected readonly ayudaEstado = AYUDA_ESTADO;
  protected readonly seleccionado = signal<number | null>(null);
  protected readonly matricula = signal<MatriculaResponse | null>(null);
  protected readonly errorMatricula = signal<string | null>(null);

  protected readonly pagos = signal<PagoResponse[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.error.set(null);
    this.service.listar().subscribe({
      next: (data) => this.pagos.set([...data].sort((a, b) => b.id - a.id)),
      error: (e) => this.error.set(mensajeError(e, 'No se pudieron cargar los pagos.')),
    });
  }

  // Abre/cierra el panel de detalles; si el pago viene de una matricula, la trae de matricula-ms
  protected verDetalles(pago: PagoResponse): void {
    if (this.seleccionado() === pago.id) {
      this.seleccionado.set(null);
      return;
    }
    this.seleccionado.set(pago.id);
    this.matricula.set(null);
    this.errorMatricula.set(null);
    if (pago.matriculaId) {
      this.matriculaService.obtener(pago.matriculaId).subscribe({
        next: (m) => this.matricula.set(m),
        error: (e) => this.errorMatricula.set(mensajeError(e, 'No se pudo cargar la matricula.')),
      });
    }
  }

  protected creditos(m: MatriculaResponse): number {
    return m.detalles.reduce((total, d) => total + d.creditos, 0);
  }

  protected fecha(valor: string | null | undefined): string {
    return valor ? valor.slice(0, 16).replace('T', ' ') : '-';
  }

  // Cargo PENDIENTE: crea la preferencia (el backend lo pasa a EN_PROCESO) y va a Mercado Pago.
  protected pagar(pago: PagoResponse): void {
    this.errorAccion.set(null);
    this.exito.set(null);
    this.service.crearPreferencia(pago.id).subscribe({
      next: (pref) => (window.location.href = pref.initPoint || pref.sandboxInitPoint),
      error: (e) => this.errorAccion.set(mensajeError(e, 'No se pudo iniciar el pago en Mercado Pago.')),
    });
  }

  protected aceptar(pago: PagoResponse): void {
    this.accion(this.service.aceptar(pago.id), `Pago ${pago.id} aprobado.`, 'No se pudo aprobar el pago.');
  }

  protected rechazar(pago: PagoResponse): void {
    this.accion(this.service.rechazar(pago.id), `Pago ${pago.id} rechazado.`, 'No se pudo rechazar el pago.');
  }

  protected reembolsar(pago: PagoResponse): void {
    if (!confirm(`Reembolsar S/ ${pago.monto} del pago ${pago.id}?`)) {
      return;
    }
    this.accion(this.service.reembolsar(pago.id), `Pago ${pago.id} reembolsado.`, 'No se pudo reembolsar el pago.');
  }

  private accion(peticion: Observable<unknown>, ok: string, fallo: string): void {
    this.errorAccion.set(null);
    this.exito.set(null);
    peticion.subscribe({
      next: () => {
        this.exito.set(ok);
        this.cargar();
      },
      error: (e) => this.errorAccion.set(mensajeError(e, fallo)),
    });
  }
}
