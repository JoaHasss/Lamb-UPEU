// Igual que BecaAplicadaRequest/Response de lamb-finanzas-ms (/api/v1/descuentos-becas/becas-aplicadas)
export interface BecasAplicadasRequest {
  idPersona: number;
  idTipoBeca: number;
  porcentaje: number;
  fechaInicio: string;
}

export interface BecasAplicadasResponse {
  id: number;
  idPersona: number;
  idTipoBeca: number;
  porcentaje: number;
  fechaInicio: string;
}
