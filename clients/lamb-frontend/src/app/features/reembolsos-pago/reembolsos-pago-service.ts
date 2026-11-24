import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReembolsosPagoRequest, ReembolsosPagoResponse } from './reembolsos-pago.model';

@Injectable({ providedIn: 'root' })
export class ReembolsosPagoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/reembolsos-cancelaciones/reembolsos-pago`;

  listar(): Observable<ReembolsosPagoResponse[]> {
    return this.http.get<ReembolsosPagoResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<ReembolsosPagoResponse> {
    return this.http.get<ReembolsosPagoResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: ReembolsosPagoRequest): Observable<ReembolsosPagoResponse> {
    return this.http.post<ReembolsosPagoResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: ReembolsosPagoRequest): Observable<ReembolsosPagoResponse> {
    return this.http.put<ReembolsosPagoResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
