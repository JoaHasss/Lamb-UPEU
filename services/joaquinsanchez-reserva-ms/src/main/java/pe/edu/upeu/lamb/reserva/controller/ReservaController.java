package pe.edu.upeu.lamb.reserva.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.lamb.reserva.dto.ReservaRequest;
import pe.edu.upeu.lamb.reserva.entity.Reserva;
import pe.edu.upeu.lamb.reserva.event.ReservaEvento;
import pe.edu.upeu.lamb.reserva.messaging.ReservaProducer;
import pe.edu.upeu.lamb.reserva.repository.ReservaRepository;

import java.util.List;

/*
 * ============================================================================================
 * PASO 14 de 15: controller/<Recurso>Controller.java  (POST 202 y GET lista)
 * ============================================================================================
 * CAMBIAR:
 *   - Nombre: <Recurso>Controller y todos los tipos Notificacion* -> <Recurso>*
 *   - @RequestMapping: la ruta del examen   ej. "/api/v1/notificaciones" -> "/api/v1/reservas"
 *     (la MISMA que pusiste en el Path del gateway, PASO 6)
 *   - .tipo("notificacion.solicitada") -> el "evento de entrada" de la Tabla 2   ej. "reserva.solicitada"
 *   - Un .campo(req.campo()) por cada campo del Request (PASO 12).
 *
 * OJO:
 *   - El POST NO guarda nada en la BD: solo publica y responde 202 Accepted. Quien guarda es
 *     el consumer (PASO 15). Por eso el resultado se ve "unos segundos despues" con el GET.
 *
 * Verificar (PowerShell; cambia puerto, ruta y JSON):
 *   Invoke-RestMethod -Method Post -Uri http://localhost:8095/api/v1/notificaciones -ContentType "application/json" -Body '{"referencia":"NOT-001","destinatario":"ana@correo.com","canal":"EMAIL","mensaje":"Tu pedido salio"}'
 *   Invoke-RestMethod http://localhost:8095/api/v1/notificaciones
 *
 * SIGUIENTE: messaging/<Recurso>Consumer.java (PASO 15, la saga)
 */
@RestController
@RequestMapping("/api/v1/Reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaProducer producer;
    private final ReservaRepository repository;

    @PostMapping
    public ResponseEntity<Void> solicitar(@RequestBody ReservaRequest req) {
        producer.publicar(ReservaEvento.builder()
                .tipo("reserva.solicitada")
                .referencia(req.referencia())
                .destinatario(req.destinatario())
                .canal(req.canal())
                .mensaje(req.mensaje())
                .build());
        return ResponseEntity.accepted().build();
    }

    @GetMapping
    public List<Reserva> listar() {
        return repository.findAll();
    }
}
