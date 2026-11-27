package pe.edu.upeu.lamb.notificacion.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/*
 * ============================================================================================
 * PASO 8 de 15: event/<Recurso>Evento.java  (el MENSAJE que viaja por Kafka, NO es una tabla)
 * ============================================================================================
 * CAMBIAR:
 *   - Nombre de la clase y del archivo: <Recurso>Evento   ej. NotificacionEvento -> ReservaEvento
 *   - Los campos: "tipo" + "referencia" (o el id de negocio que pida el examen) + los campos del POST.
 *     ej. si el POST trae {codigo, cliente, fecha} -> private String tipo; codigo; cliente; fecha;
 *
 * OJO:
 *   - El paquete DEBE ser ...<recurso>.event porque en el PASO 5 pusiste
 *       spring.json.trusted.packages: pe.edu.upeu.lamb.<recurso>.event
 *       spring.json.value.default.type: pe.edu.upeu.lamb.<recurso>.event.<Recurso>Evento
 *     Si no coincide: "The class '...' is not in the trusted packages".
 *   - @NoArgsConstructor es OBLIGATORIO: Jackson crea el objeto vacio y luego lo llena.
 *   - "tipo" lleva los 3 eventos del mismo topic: <recurso>.solicitada / .enviada / .fallida
 *     (los nombres exactos salen de la Tabla 2 del examen).
 *
 * SIGUIENTE: entity/Estado<Recurso>.java (PASO 9)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionEvento {
    private String tipo;
    private String referencia;
    private String destinatario;
    private String canal;
    private String mensaje;
}
