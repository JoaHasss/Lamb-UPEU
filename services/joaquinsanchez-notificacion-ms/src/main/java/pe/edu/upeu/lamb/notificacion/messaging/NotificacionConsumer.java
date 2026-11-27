package pe.edu.upeu.lamb.notificacion.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import pe.edu.upeu.lamb.notificacion.entity.EstadoNotificacion;
import pe.edu.upeu.lamb.notificacion.entity.Notificacion;
import pe.edu.upeu.lamb.notificacion.event.NotificacionEvento;
import pe.edu.upeu.lamb.notificacion.repository.NotificacionRepository;

/*
 * ============================================================================================
 * PASO 15 de 15: messaging/<Recurso>Consumer.java  (LA SAGA)
 * ============================================================================================
 * CAMBIAR (marcado con "CAMBIAR" en cada bloque):
 *   - Nombre: <Recurso>Consumer y todos los tipos Notificacion* -> <Recurso>*
 *   - groupId: <tunombre>-<recurso>-ms (igual al group-id del PASO 5)
 *   - Los 3 nombres de evento y los 3 estados (Tabla 2 del examen).
 *   - La condicion de falla ("Falla cuando ..." de la Tabla 2).
 *
 * OJO:
 *   - SIN @Transactional a proposito: si el UNIQUE falla dentro de una transaccion, esta queda
 *     marcada para rollback y el catch no la salva. Sin ella, cada save es su propia transaccion.
 *   - El consumer NUNCA debe lanzar excepcion: si lo hace, Kafka reintenta y la fila puede
 *     quedarse en el estado inicial (PENDIENTE) -> 0 puntos en compensacion.
 *
 * Verificar:
 *   - Kafka UI (http://localhost:18090) > Consumers > grupo <tunombre>-<recurso>-ms = Stable
 *   - Log del servicio: "Duplicado ignorado: ..." al reenviar el mismo mensaje.
 *   - docker exec -it <container_postgres> psql -U lamb -d <bd> -c "SELECT referencia, estado FROM <recursos>;"
 *
 * SIGUIENTE: crear el topic, probar y Grafana -> GUIA-EXAMEN.md secciones 5 a 8
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificacionConsumer {

    private final NotificacionRepository repository;
    private final NotificacionProducer producer;

    // CAMBIAR groupId: <tunombre>-<recurso>-ms   ej. "joaquinsanchez-reserva-ms"
    @KafkaListener(topics = "${app.kafka.topic.eventos}", groupId = "joaquinsanchez-notificacion-ms")
    public void consumir(NotificacionEvento evento) {

        // 1) Filtro: el consumer tambien recibe sus propios eventos de salida (mismo topic).
        //    Solo procesa el evento de ENTRADA.
        //    CAMBIAR: "notificacion.solicitada" -> evento de entrada de la Tabla 2 (ej. "reserva.solicitada")
        if (evento == null || !"notificacion.solicitada".equals(evento.getTipo())) {
            return;
        }

        // 2) Idempotencia (1ra defensa): si ya existe ese id de negocio, se ignora el mensaje repetido.
        //    CAMBIAR: existsByReferencia / getReferencia -> existsBy<CampoUnico> / get<CampoUnico>
        if (repository.existsByReferencia(evento.getReferencia())) {
            log.info("Duplicado ignorado: {}", evento.getReferencia());
            return;
        }

        // 3) Registra la fila en el estado INICIAL.
        //    Idempotencia (2da defensa): si dos duplicados llegan a la vez, el UNIQUE de la BD
        //    rechaza el segundo y aqui se ignora.
        //    CAMBIAR: un .campo(evento.getCampo()) por cada columna; PENDIENTE -> estado inicial de la Tabla 2
        Notificacion n;
        try {
            n = repository.saveAndFlush(Notificacion.builder()
                    .referencia(evento.getReferencia())
                    .destinatario(evento.getDestinatario())
                    .canal(evento.getCanal())
                    .mensaje(evento.getMensaje())
                    .estado(EstadoNotificacion.PENDIENTE)
                    .build());
        } catch (DataIntegrityViolationException e) {
            log.info("Duplicado ignorado por UNIQUE: {}", evento.getReferencia());
            return;
        }

        // 4) Decision de la saga.
        //    CAMBIAR la condicion: "Falla cuando ..." de la Tabla 2. Ejemplos:
        //      destinatario es INVALIDO  -> "INVALIDO".equals(evento.getDestinatario())
        //      monto mayor a 1000        -> evento.getMonto() != null && evento.getMonto() > 1000
        //      cantidad es 0             -> evento.getCantidad() == 0
        if ("INVALIDO".equals(evento.getDestinatario())) {
            // Compensacion. CAMBIAR: CANCELADA y "notificacion.fallida" -> estado y evento de falla de la Tabla 2
            n.setEstado(EstadoNotificacion.CANCELADA);
            repository.save(n);
            evento.setTipo("notificacion.fallida");
        } else {
            // Camino feliz. CAMBIAR: ENVIADA y "notificacion.enviada" -> estado y evento de exito de la Tabla 2
            n.setEstado(EstadoNotificacion.ENVIADA);
            repository.save(n);
            evento.setTipo("notificacion.enviada");
        }

        // 5) Publica el resultado al mismo topic (lo vera el profe en Kafka UI).
        producer.publicar(evento);
    }
}
