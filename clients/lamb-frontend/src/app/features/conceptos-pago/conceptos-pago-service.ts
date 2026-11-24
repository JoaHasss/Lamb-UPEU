import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConceptosPagoRequest, ConceptosPagoResponse } from './conceptos-pago.model';

@Injectable({ providedIn: 'root' })
export class ConceptosPagoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/catalogos-tarifas/conceptos-pago`;

  listar(): Observable<ConceptosPagoResponse[]> {
    return this.http.get<ConceptosPagoResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<ConceptosPagoResponse> {
    return this.http.get<ConceptosPagoResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: ConceptosPagoRequest): Observable<ConceptosPagoResponse> {
    return this.http.post<ConceptosPagoResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: ConceptosPagoRequest): Observable<ConceptosPagoResponse> {
    return this.http.put<ConceptosPagoResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
