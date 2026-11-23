package pe.edu.upeu.ingresospagos.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Espejo de MatriculaConfirmadaEvento (lamb-matricula-ms, topic matricula-eventos): mismos
 * campos para que Jackson lo deserialice igual, cada servicio mantiene su propia copia de la
 * clase (sin dependencia compartida entre microservicios).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatriculaCreadaEvento {

    private String tipoEvento;
    private Long matriculaId;
    private Long idPersona;
    private String periodo;
    private Long timestamp;
}
