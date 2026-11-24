import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BecasAplicadasRequest, BecasAplicadasResponse } from './becas-aplicadas.model';

@Injectable({ providedIn: 'root' })
export class BecasAplicadasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/descuentos-becas/becas-aplicadas`;

  listar(): Observable<BecasAplicadasResponse[]> {
    return this.http.get<BecasAplicadasResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<BecasAplicadasResponse> {
    return this.http.get<BecasAplicadasResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: BecasAplicadasRequest): Observable<BecasAplicadasResponse> {
    return this.http.post<BecasAplicadasResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: BecasAplicadasRequest): Observable<BecasAplicadasResponse> {
    return this.http.put<BecasAplicadasResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
