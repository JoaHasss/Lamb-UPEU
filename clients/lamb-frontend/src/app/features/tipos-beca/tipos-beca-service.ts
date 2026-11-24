import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TiposBecaRequest, TiposBecaResponse } from './tipos-beca.model';

@Injectable({ providedIn: 'root' })
export class TiposBecaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/descuentos-becas/tipos-beca`;

  listar(): Observable<TiposBecaResponse[]> {
    return this.http.get<TiposBecaResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<TiposBecaResponse> {
    return this.http.get<TiposBecaResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: TiposBecaRequest): Observable<TiposBecaResponse> {
    return this.http.post<TiposBecaResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: TiposBecaRequest): Observable<TiposBecaResponse> {
    return this.http.put<TiposBecaResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
