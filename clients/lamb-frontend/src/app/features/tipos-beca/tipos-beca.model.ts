export interface TiposBecaRequest {
  id?: number;
  nombre: string;
  descripcion?: string;
}

export interface TiposBecaResponse {
  id: number;
  nombre: string;
  descripcion: string;
}
