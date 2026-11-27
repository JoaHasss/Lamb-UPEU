package pe.edu.upeu.lamb.notificacion.entity;

/*
 * ============================================================================================
 * PASO 9 de 15: entity/Estado<Recurso>.java  (los estados de la saga)
 * ============================================================================================
 * CAMBIAR:
 *   - Nombre: Estado<Recurso>   ej. EstadoNotificacion -> EstadoReserva
 *   - Valores: los de la Tabla 2 del examen (estado inicial, camino feliz, compensacion).
 *     ej. PENDIENTE, CONFIRMADA, CANCELADA
 *
 * OJO: la columna "estado" de la tabla es VARCHAR(20): ningun valor puede pasar de 20 letras.
 *
 * SIGUIENTE: entity/<Recurso>.java (PASO 10)
 */
public enum EstadoNotificacion {
    PENDIENTE, ENVIADA, CANCELADA
}
