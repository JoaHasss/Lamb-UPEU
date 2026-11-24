export type MetodoPago = 'MERCADOPAGO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'EFECTIVO';

export type EstadoPago = 'PENDIENTE' | 'EN_PROCESO' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';

export interface PagoRequest {
  idPersona: number;
  matriculaId: number | null;
  concepto: string;
  monto: number;
  metodo: MetodoPago;
}

export interface PagoResponse {
  id: number;
  idPersona: number;
  matriculaId: number | null;
  concepto: string;
  monto: number;
  // null mientras el cargo esta PENDIENTE
  metodo: MetodoPago | null;
  estado: EstadoPago;
  fechaPago: string;
  referenciaExterna: string | null;
  // Datos del voucher (solo pagos por transferencia/deposito)
  numeroOperacion?: string | null;
  bancoReferencia?: string | null;
  fechaVoucher?: string | null;
  archivoVoucher?: string | null;
}

export interface PreferenciaPagoResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}
