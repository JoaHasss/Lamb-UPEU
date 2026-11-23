package pe.edu.upeu.ingresospagos.messaging;

import pe.edu.upeu.ingresospagos.event.MatriculaCreadaEvento;
import pe.edu.upeu.ingresospagos.event.PagoValidadoEvento;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Reacciona a matricula.registrada (topic matricula-eventos) y publica pago.validado (topic
 * pago-eventos) para que lms-ms habilite el acceso provisional del estudiante al curso.
 * TEMPORAL: valida sin reglas reales (siempre VALIDADO, sin monto) — el productor y el consumidor
 * ya existian en el codigo pero nada los conectaba; esto cierra el circuito para la demo. Cuando
 * se defina la regla real (voucher subido, pago confirmado, etc.) esta clase es el lugar a ampliar.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatriculaEventosConsumer {

    private static final String MATRICULA_REGISTRADA = "matricula.registrada";
    private static final String PAGO_VALIDADO = "pago.validado";

    private final PagoEventosProducer producer;

    @Value("${spring.application.name}")
    private String nombreServicio;

    @KafkaListener(topics = "${app.kafka.topic.matriculas}")
    public void alRecibirMatricula(MatriculaCreadaEvento evento) {
        if (!MATRICULA_REGISTRADA.equals(evento.getTipoEvento())) {
            log.warn("component=consumer eventType={} status=ignored", evento.getTipoEvento());
            return;
        }
        log.info("component=consumer eventType={} matriculaId={} idPersona={} status=consumed",
                evento.getTipoEvento(), evento.getMatriculaId(), evento.getIdPersona());

        producer.publicarTrasCommit(PagoValidadoEvento.builder()
                .tipoEvento(PAGO_VALIDADO)
                .matriculaId(evento.getMatriculaId())
                .estado("VALIDADO")
                .origen(nombreServicio)
                .timestamp(Instant.now().toEpochMilli())
                .build());
    }
}
