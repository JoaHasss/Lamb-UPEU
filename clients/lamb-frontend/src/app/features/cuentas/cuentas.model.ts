// Igual que CuentaEstudianteRequest/Response de lamb-finanzas-ms (/api/v1/saldo-estudiante/cuentas)
export interface CuentasRequest {
  idPersona: number;
  saldoActual: number;
}

export interface CuentasResponse {
  id: number;
  idPersona: number;
  saldoActual: number;
  fechaApertura: string;
}
