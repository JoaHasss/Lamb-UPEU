// Igual que ConceptoPagoRequest/Response de lamb-finanzas-ms (/api/v1/catalogos-tarifas/conceptos-pago)
export interface ConceptosPagoRequest {
  idCategoria: number;
  nombre: string;
  monto: number;
  vigenciaDesde: string;
  vigenciaHasta?: string | null;
}

export interface ConceptosPagoResponse {
  id: number;
  idCategoria: number;
  nombre: string;
  monto: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}
