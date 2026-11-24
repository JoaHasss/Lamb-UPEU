import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CuentasRequest, CuentasResponse } from './cuentas.model';

@Injectable({ providedIn: 'root' })
export class CuentasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/saldo-estudiante/cuentas`;

  listar(): Observable<CuentasResponse[]> {
    return this.http.get<CuentasResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<CuentasResponse> {
    return this.http.get<CuentasResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: CuentasRequest): Observable<CuentasResponse> {
    return this.http.post<CuentasResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: CuentasRequest): Observable<CuentasResponse> {
    return this.http.put<CuentasResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
