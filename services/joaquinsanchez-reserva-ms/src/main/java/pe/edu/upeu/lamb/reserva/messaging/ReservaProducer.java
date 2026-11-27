package pe.edu.upeu.lamb.reserva.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import pe.edu.upeu.lamb.reserva.event.ReservaEvento;

/*
 * ============================================================================================
 * PASO 13 de 15: messaging/<Recurso>Producer.java  (publica en el topic)
 * ============================================================================================
 * CAMBIAR:
 *   - Nombre: <Recurso>Producer   ej. NotificacionProducer -> ReservaProducer
 *   - NotificacionEvento -> <Recurso>Evento (en el import, el KafkaTemplate y el metodo)
 *   - La key: evento.get<CampoUnico>()   ej. getReferencia() -> getCodigo()
 *     El examen dice "con <campo> como key del mensaje".
 *
 * OJO:
 *   - El topic NO va escrito aqui: sale de app.kafka.topic.eventos del PASO 5.
 *   - El topic debe EXISTIR antes de publicar (Kafka no los crea solo). Ver GUIA-EXAMEN.md.
 *   - Misma key = misma particion = los eventos de esa referencia llegan en orden.
 *
 * SIGUIENTE: controller/<Recurso>Controller.java (PASO 14)
 */
@Component
@RequiredArgsConstructor
public class ReservaProducer {

    private final KafkaTemplate<String, ReservaEvento> kafkaTemplate;

    @Value("${app.kafka.topic.eventos}")
    private String topic;

    public void publicar(ReservaEvento evento) {
        kafkaTemplate.send(topic, evento.getReferencia(), evento);
    }
}
