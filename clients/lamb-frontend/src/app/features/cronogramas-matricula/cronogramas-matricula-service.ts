import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CronogramasMatriculaRequest, CronogramasMatriculaResponse } from './cronogramas-matricula.model';

@Injectable({ providedIn: 'root' })
export class CronogramasMatriculaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/calendario-periodos/cronogramas`;

  listar(): Observable<CronogramasMatriculaResponse[]> {
    return this.http.get<CronogramasMatriculaResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<CronogramasMatriculaResponse> {
    return this.http.get<CronogramasMatriculaResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: CronogramasMatriculaRequest): Observable<CronogramasMatriculaResponse> {
    return this.http.post<CronogramasMatriculaResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: CronogramasMatriculaRequest): Observable<CronogramasMatriculaResponse> {
    return this.http.put<CronogramasMatriculaResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
