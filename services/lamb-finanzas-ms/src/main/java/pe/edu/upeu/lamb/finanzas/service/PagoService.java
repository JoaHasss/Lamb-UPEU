package pe.edu.upeu.lamb.finanzas.service;

import pe.edu.upeu.lamb.finanzas.dto.PagoRequest;
import pe.edu.upeu.lamb.finanzas.dto.PagoResponse;
import pe.edu.upeu.lamb.finanzas.entity.EstadoPago;
import pe.edu.upeu.lamb.finanzas.entity.Pago;
import pe.edu.upeu.lamb.finanzas.event.MatriculaConfirmadaEvento;
import pe.edu.upeu.lamb.finanzas.event.PagoAceptadoEvento;
import pe.edu.upeu.lamb.finanzas.exception.BusinessRuleException;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.mapper.PagoMapper;
import pe.edu.upeu.lamb.finanzas.messaging.PagoEventosProducer;
import pe.edu.upeu.lamb.finanzas.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagoService {

    // Placeholder: el costo real por periodo lo calcula Core academico (Curriculo/Planificacion).
    // Aqui se deja fijo porque el flujo de costo real aun no esta integrado con finanzas.
    private static final BigDecimal MONTO_MATRICULA_PLACEHOLDER = new BigDecimal("350.00");

    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    private final PagoRepository pagoRepository;
    private final PagoMapper pagoMapper;
    private final PagoEventosProducer pagoEventosProducer;
    private final CalculoDescuentoService calculoDescuentoService;
    private final SaldoCuentaService saldoCuentaService;

    /**
     * Idempotente por matriculaId: si el evento matricula.confirmada se reentrega, no genera
     * un segundo cargo (constraint unica en matricula_id respalda esto a nivel de BD tambien).
     */
    @Transactional
    public void generarCargoDeMatricula(MatriculaConfirmadaEvento evento) {
        if (pagoRepository.existsByMatriculaId(evento.getMatriculaId())) {
            log.warn("component=processor matriculaId={} status=ignored motivo=\"cargo ya generado\"",
                    evento.getMatriculaId());
            return;
        }
        CalculoDescuentoService.Resultado calculo = calculoDescuentoService.calcular(
                evento.getIdPersona(), MONTO_MATRICULA_PLACEHOLDER, LocalDate.now(ZONA_LIMA));
        Pago pago = Pago.builder()
                .idPersona(evento.getIdPersona())
                .matriculaId(evento.getMatriculaId())
                .concepto("Matricula " + evento.getPeriodo())
                .monto(calculo.montoFinal())
                .montoOriginal(calculo.montoOriginal())
                .montoDescuento(calculo.montoDescuento())
                .estado(EstadoPago.PENDIENTE)
                .fechaPago(Instant.now())
                .build();
        Pago guardado = pagoRepository.save(pago);
        saldoCuentaService.cargarPago(guardado);
        log.info("component=processor matriculaId={} idPersona={} pagoId={} estado={} montoOriginal={} becaPct={} descuentoPct={} montoFinal={} status=processed",
                evento.getMatriculaId(), evento.getIdPersona(), guardado.getId(), guardado.getEstado(),
                calculo.montoOriginal(), calculo.porcentajeBeca(), calculo.porcentajeDescuento(), calculo.montoFinal());
    }

    public List<PagoResponse> listar(Long idPersonaSolicitante, boolean privilegiado) {
        List<Pago> pagos = privilegiado
                ? pagoRepository.findAll()
                : pagoRepository.findByIdPersona(idPersonaSolicitante);
        return pagos.stream().map(pagoMapper::toResponse).toList();
    }

    public PagoResponse obtener(Long id, Long idPersonaSolicitante, boolean privilegiado) {
        Pago pago = buscarOFallar(id);
        if (!privilegiado && !pago.getIdPersona().equals(idPersonaSolicitante)) {
            throw new ResourceNotFoundException("Pago no encontrado: " + id);
        }
        return pagoMapper.toResponse(pago);
    }

    /**
     * El estudiante registra el pago (voucher) pero queda EN_PROCESO hasta que
     * ADMIN/COORDINADOR lo valide con aceptar()/rechazar() (saga paga-antes-de-confirmar).
     */
    @Transactional
    public PagoResponse procesar(PagoRequest request) {
        // Si la matricula ya tiene su cargo, este pago es solo el intento de pagarlo: la deuda
        // ya esta en la cuenta. Si no (tramites), el pago trae su propio cargo.
        boolean pagaCargoExistente = request.getMatriculaId() != null
                && pagoRepository.existsByMatriculaId(request.getMatriculaId());
        Pago pago = pagoMapper.toEntity(request);
        pago.setEstado(EstadoPago.EN_PROCESO);
        pago.setReferenciaExterna(UUID.randomUUID().toString());
        Pago guardado = pagoRepository.save(pago);
        if (!pagaCargoExistente) {
            saldoCuentaService.cargarPago(guardado);
        }
        return pagoMapper.toResponse(guardado);
    }

    @Transactional
    public PagoResponse aceptar(Long id) {
        Pago pago = buscarOFallar(id);
        validarEstado(pago, EstadoPago.EN_PROCESO, "aceptar");
        pago.setEstado(EstadoPago.APROBADO);
        Pago guardado = pagoRepository.save(pago);
        saldoCuentaService.abonarPago(guardado);
        pagoEventosProducer.publicarTrasCommit(PagoAceptadoEvento.builder()
                .tipoEvento("pago.aceptado")
                .idPago(guardado.getId())
                .matriculaId(guardado.getMatriculaId())
                .idPersona(guardado.getIdPersona())
                .monto(guardado.getMonto())
                .fechaAceptacion(Instant.now())
                .build());
        return pagoMapper.toResponse(guardado);
    }

    @Transactional
    public PagoResponse rechazar(Long id) {
        Pago pago = buscarOFallar(id);
        validarEstado(pago, EstadoPago.EN_PROCESO, "rechazar");
        pago.setEstado(EstadoPago.RECHAZADO);
        Pago guardado = pagoRepository.save(pago);
        // Tramite rechazado: no se da, su cargo se anula. Una matricula rechazada se sigue
        // debiendo (se anula con "Cancelacion de cargo de matricula").
        if (guardado.getMatriculaId() == null) {
            saldoCuentaService.anularCargoPago(guardado, "Pago rechazado, se anula el cargo");
        }
        return pagoMapper.toResponse(guardado);
    }

    // El reembolso no cambia el saldo: el cargo ya se pago (abono) y el dinero vuelve fuera de la cuenta.
    public PagoResponse reembolsar(Long id) {
        Pago pago = buscarOFallar(id);
        validarEstado(pago, EstadoPago.APROBADO, "reembolsar");
        pago.setEstado(EstadoPago.REEMBOLSADO);
        return pagoMapper.toResponse(pagoRepository.save(pago));
    }

    private void validarEstado(Pago pago, EstadoPago esperado, String accion) {
        if (pago.getEstado() != esperado) {
            throw new BusinessRuleException("No se puede " + accion + " el pago " + pago.getId()
                    + ": esta en estado " + pago.getEstado() + ", se esperaba " + esperado);
        }
    }

    private Pago buscarOFallar(Long id) {
        return pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado: " + id));
    }
}
