import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

// Opciones para los desplegables de Finanzas y Matricula: en vez de escribir un id a mano,
// el usuario elige entre los registros que ya existen.

export interface CronogramaOpcion {
  id: number;
  periodo: string;
  descripcion: string | null;
}

export interface CategoriaConceptoOpcion {
  id: number;
  nombre: string;
}

export interface SolicitudDevolucionOpcion {
  id: number;
  idPago: number;
  motivo: string;
  montoSolicitado: number;
  estado: string;
}

export interface CuentaEstudianteOpcion {
  id: number;
  idPersona: number;
  saldoActual: number;
}

export interface TipoBecaOpcion {
  id: number;
  nombre: string;
}

export interface PersonaOpcion {
  id: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
}

export interface PagoOpcion {
  id: number;
  idPersona: number;
  concepto: string;
  monto: number;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class OpcionesFinanzasMatricula {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/v1`;

  cronogramas(): Observable<CronogramaOpcion[]> {
    return this.lista(`${this.api}/calendario-periodos/cronogramas`);
  }

  categoriasConcepto(): Observable<CategoriaConceptoOpcion[]> {
    return this.lista(`${this.api}/catalogos-tarifas/categorias-concepto`);
  }

  solicitudesDevolucion(): Observable<SolicitudDevolucionOpcion[]> {
    return this.lista(`${this.api}/reembolsos-cancelaciones/solicitudes-devolucion`);
  }

  cuentasEstudiante(): Observable<CuentaEstudianteOpcion[]> {
    return this.lista(`${this.api}/saldo-estudiante/cuentas`);
  }

  tiposBeca(): Observable<TipoBecaOpcion[]> {
    return this.lista(`${this.api}/descuentos-becas/tipos-beca`);
  }

  personas(): Observable<PersonaOpcion[]> {
    return this.lista(`${this.api}/persona/personas`);
  }

  pagos(): Observable<PagoOpcion[]> {
    return this.lista(`${this.api}/pagos`);
  }

  // Si el servicio falla, el desplegable queda vacio en vez de romper la pantalla
  private lista<T>(url: string): Observable<T[]> {
    return this.http.get<T[]>(url).pipe(catchError(() => of([] as T[])));
  }
}
