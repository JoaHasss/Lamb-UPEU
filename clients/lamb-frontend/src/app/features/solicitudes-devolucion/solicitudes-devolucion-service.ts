import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SolicitudesDevolucionRequest, SolicitudesDevolucionResponse } from './solicitudes-devolucion.model';

@Injectable({ providedIn: 'root' })
export class SolicitudesDevolucionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/reembolsos-cancelaciones/solicitudes-devolucion`;

  listar(): Observable<SolicitudesDevolucionResponse[]> {
    return this.http.get<SolicitudesDevolucionResponse[]>(this.baseUrl);
  }

  obtener(id: number): Observable<SolicitudesDevolucionResponse> {
    return this.http.get<SolicitudesDevolucionResponse>(`${this.baseUrl}/${id}`);
  }

  crear(request: SolicitudesDevolucionRequest): Observable<SolicitudesDevolucionResponse> {
    return this.http.post<SolicitudesDevolucionResponse>(this.baseUrl, request);
  }

  actualizar(id: number, request: SolicitudesDevolucionRequest): Observable<SolicitudesDevolucionResponse> {
    return this.http.put<SolicitudesDevolucionResponse>(`${this.baseUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
