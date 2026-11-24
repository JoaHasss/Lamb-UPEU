import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AmpliacionesPlazoMatriculaRequest, AmpliacionesPlazoMatriculaResponse } from './ampliaciones-plazo-matricula.model';

@Injectable({ providedIn: 'root' })
export class AmpliacionesPlazoMatriculaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/calendario-periodos/ampliaciones-plazo`;

  listar(): Observable<AmpliacionesPlazoMatriculaResponse[]> {
    return this.http.get<AmpliacionesPlazoMatriculaResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<AmpliacionesPlazoMatriculaResponse> {
    return this.http.get<AmpliacionesPlazoMatriculaResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: AmpliacionesPlazoMatriculaRequest): Observable<AmpliacionesPlazoMatriculaResponse> {
    return this.http.post<AmpliacionesPlazoMatriculaResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: AmpliacionesPlazoMatriculaRequest): Observable<AmpliacionesPlazoMatriculaResponse> {
    return this.http.put<AmpliacionesPlazoMatriculaResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
