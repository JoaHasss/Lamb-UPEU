import { LowerCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { mensajeError } from '../../core/http/mensaje-error';
import { PagoService } from './pago-service';
import { PagoResponse } from './pago.model';

/** A donde Mercado Pago (Checkout Pro) redirige al navegador tras el pago. */
@Component({
  selector: 'app-pago-resultado',
  imports: [RouterLink, LowerCasePipe],
  template: `
    <div class="wrap">
      <h2>Resultado del pago</h2>
      @if (cargando()) {
        <p>Confirmando el pago con Mercado Pago...</p>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      } @else if (pago()?.estado === 'APROBADO') {
        <p class="ok">Pago aprobado. Referencia: {{ pago()?.referenciaExterna }}</p>
      } @else {
        <p class="rechazado">Pago {{ pago()?.estado | lowercase }}.</p>
      }
      <a routerLink="/pagos">Volver a pagos</a>
    </div>
  `,
  styles: [`
    .wrap { max-width: 480px; margin: 4rem auto; padding: 1rem; font-family: system-ui; text-align: center; }
    .ok { color: #16A34A; }
    .error, .rechazado { color: #DC2626; }
  `],
})
export class PagoResultadoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PagoService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pago = signal<PagoResponse | null>(null);

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const idPago = Number(params.get('pagoId'));
    const paymentId = Number(params.get('payment_id'));
    if (!idPago || !paymentId) {
      this.cargando.set(false);
      this.error.set('Mercado Pago no devolvio los datos esperados (pagoId / payment_id).');
      return;
    }
    this.service.confirmarMercadoPago(idPago, paymentId).subscribe({
      next: (p) => {
        this.pago.set(p);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo confirmar el pago.'));
        this.cargando.set(false);
      },
    });
  }
}
