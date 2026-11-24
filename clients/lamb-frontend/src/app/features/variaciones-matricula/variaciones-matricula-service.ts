import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VariacionesMatriculaRequest, VariacionesMatriculaResponse } from './variaciones-matricula.model';

@Injectable({ providedIn: 'root' })
export class VariacionesMatriculaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/calendario-periodos/variaciones`;

  listar(): Observable<VariacionesMatriculaResponse[]> {
    return this.http.get<VariacionesMatriculaResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<VariacionesMatriculaResponse> {
    return this.http.get<VariacionesMatriculaResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: VariacionesMatriculaRequest): Observable<VariacionesMatriculaResponse> {
    return this.http.post<VariacionesMatriculaResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: VariacionesMatriculaRequest): Observable<VariacionesMatriculaResponse> {
    return this.http.put<VariacionesMatriculaResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
