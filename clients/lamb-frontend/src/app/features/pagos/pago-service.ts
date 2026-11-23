import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagoRequest, PagoResponse, PreferenciaPagoResponse } from './pago.model';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/pagos`;

  listar(): Observable<PagoResponse[]> {
    return this.http.get<PagoResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<PagoResponse> {
    return this.http.get<PagoResponse>(`${this.baseUrl}/${id}`);
  }

  procesar(request: PagoRequest): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(this.baseUrl, request);
  }

  // Confirma un pago EN_PROCESO (el metodo ya quedo fijado al crear el pago).
  aceptar(id: number): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.baseUrl}/${id}/aceptar`, {});
  }

  rechazar(id: number): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.baseUrl}/${id}/rechazar`, {});
  }

  reembolsar(id: number): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.baseUrl}/${id}/reembolsar`, {});
  }

  // Checkout Pro: redirigir el navegador a initPoint/sandboxInitPoint para que el usuario pague.
  // NOTA: en esta cuenta de Mercado Pago, Checkout Pro falla siempre al cobrar (pantalla "/fatal/");
  // el metodo que SI funciona es pagarConPasarela (Orders API directa, con el cardToken del SDK JS).
  crearPreferencia(id: number): Observable<PreferenciaPagoResponse> {
    return this.http.post<PreferenciaPagoResponse>(`${this.baseUrl}/${id}/preferencia`, {});
  }

  // Cobro directo (Orders API): el cardToken ya viene tokenizado por el SDK JS de Mercado Pago.
  pagarConPasarela(id: number, cardToken: string, payerEmail: string): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.baseUrl}/${id}/pasarela`, { cardToken, payerEmail });
  }

  // Al volver del Checkout Pro, con el payment_id que Mercado Pago agrego a la back_url.
  confirmarMercadoPago(id: number, paymentId: number): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.baseUrl}/${id}/confirmar-mercadopago`, null, { params: { paymentId } });
  }
}
