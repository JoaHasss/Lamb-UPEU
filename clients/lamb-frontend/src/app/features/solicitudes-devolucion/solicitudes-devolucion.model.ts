// Igual que SolicitudDevolucionRequest/Response de lamb-finanzas-ms
// (/api/v1/reembolsos-cancelaciones/solicitudes-devolucion)
export type EstadoSolicitudDevolucion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudesDevolucionRequest {
  idPago: number;
  motivo: string;
  montoSolicitado: number;
  estado: EstadoSolicitudDevolucion;
  fecha: string;
}

export interface SolicitudesDevolucionResponse {
  id: number;
  idPago: number;
  motivo: string;
  montoSolicitado: number;
  estado: EstadoSolicitudDevolucion;
  fecha: string;
}
