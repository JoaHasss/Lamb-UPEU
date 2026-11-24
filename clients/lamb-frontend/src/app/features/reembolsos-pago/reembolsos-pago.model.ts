// Igual que ReembolsoPagoRequest/Response de lamb-finanzas-ms
// (/api/v1/reembolsos-cancelaciones/reembolsos-pago)
export interface ReembolsosPagoRequest {
  idSolicitudDevolucion: number;
  idCuentaEstudiante: number;
  montoReembolsado: number;
  fecha: string;
}

export interface ReembolsosPagoResponse {
  id: number;
  idSolicitudDevolucion: number;
  idCuentaEstudiante: number;
  montoReembolsado: number;
  fecha: string;
}
