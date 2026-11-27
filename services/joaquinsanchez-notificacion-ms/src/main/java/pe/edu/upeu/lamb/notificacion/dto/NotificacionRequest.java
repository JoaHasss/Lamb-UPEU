package pe.edu.upeu.lamb.notificacion.dto;

/*
 * ============================================================================================
 * PASO 12 de 15: dto/<Recurso>Request.java  (el JSON que llega en el POST)
 * ============================================================================================
 * CAMBIAR:
 *   - Nombre: <Recurso>Request   ej. NotificacionRequest -> ReservaRequest
 *   - Los campos: EXACTAMENTE las claves del JSON de ejemplo del examen (mismo nombre).
 *     ej. {"referencia":"RES-001","cliente":"ana","sala":"A1"}
 *      -> public record ReservaRequest(String referencia, String cliente, String sala) {}
 *
 * OJO: si una clave del JSON no coincide con el nombre del campo, llega null.
 *
 * SIGUIENTE: messaging/<Recurso>Producer.java (PASO 13)
 */
public record NotificacionRequest(String referencia, String destinatario, String canal, String mensaje) {
}
