package pe.edu.upeu.lamb.finanzas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.lamb.finanzas.entity.CuentaEstudiante;
import pe.edu.upeu.lamb.finanzas.entity.MovimientoCuenta;
import pe.edu.upeu.lamb.finanzas.entity.Pago;
import pe.edu.upeu.lamb.finanzas.entity.TipoMovimientoCuenta;
import pe.edu.upeu.lamb.finanzas.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.finanzas.repository.CuentaEstudianteRepository;
import pe.edu.upeu.lamb.finanzas.repository.MovimientoCuentaRepository;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Mantiene el saldo de la cuenta del estudiante. El saldo es lo que el estudiante DEBE:
 * un CARGO lo sube, un ABONO lo baja. Negativo = saldo a favor.
 *
 * Todo cambio de saldo pasa por aqui y deja un MovimientoCuenta, asi el saldo siempre
 * se explica con su historial de movimientos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SaldoCuentaService {

    private static final int MAX_CONCEPTO = 150;

    private final CuentaEstudianteRepository cuentaEstudianteRepository;
    private final MovimientoCuentaRepository movimientoCuentaRepository;

    /** Cuenta de la persona; si aun no tiene, se abre con saldo 0. */
    @Transactional(propagation = Propagation.MANDATORY)
    public CuentaEstudiante obtenerOCrearCuenta(Long idPersona) {
        return cuentaEstudianteRepository.findByIdPersona(idPersona)
                .orElseGet(() -> cuentaEstudianteRepository.save(CuentaEstudiante.builder()
                        .idPersona(idPersona)
                        .saldoActual(BigDecimal.ZERO)
                        .fechaApertura(Instant.now())
                        .build()));
    }

    /** Registra el movimiento y actualiza el saldo de la cuenta. */
    @Transactional(propagation = Propagation.MANDATORY)
    public MovimientoCuenta registrar(Long idCuenta, TipoMovimientoCuenta tipo, BigDecimal monto,
                                      String concepto, Pago pago) {
        CuentaEstudiante cuenta = cuentaEstudianteRepository.findByIdParaActualizar(idCuenta)
                .orElseThrow(() -> new ResourceNotFoundException("Cuenta de estudiante no encontrada: " + idCuenta));
        BigDecimal delta = tipo == TipoMovimientoCuenta.CARGO ? monto : monto.negate();
        cuenta.setSaldoActual(cuenta.getSaldoActual().add(delta));
        cuentaEstudianteRepository.save(cuenta);

        MovimientoCuenta movimiento = movimientoCuentaRepository.save(MovimientoCuenta.builder()
                .cuenta(cuenta)
                .tipo(tipo)
                .monto(monto)
                .concepto(recortar(concepto))
                .pago(pago)
                .fecha(Instant.now())
                .build());
        log.info("component=saldo idCuenta={} tipo={} monto={} saldo={} idPago={}",
                idCuenta, tipo, monto, cuenta.getSaldoActual(), pago != null ? pago.getId() : null);
        return movimiento;
    }

    /** El estudiante pasa a deber el monto del pago (cargo de matricula o tramite). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void cargarPago(Pago pago) {
        if (pago.getMonto().signum() <= 0 || movimientoCuentaRepository.existsByPagoIdAndTipo(pago.getId(), TipoMovimientoCuenta.CARGO)) {
            return;
        }
        CuentaEstudiante cuenta = obtenerOCrearCuenta(pago.getIdPersona());
        registrar(cuenta.getId(), TipoMovimientoCuenta.CARGO, pago.getMonto(), pago.getConcepto(), pago);
    }

    /** Pago aprobado: el monto se descuenta de la deuda. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void abonarPago(Pago pago) {
        if (pago.getMonto().signum() <= 0 || movimientoCuentaRepository.existsByPagoIdAndTipo(pago.getId(), TipoMovimientoCuenta.ABONO)) {
            return;
        }
        CuentaEstudiante cuenta = obtenerOCrearCuenta(pago.getIdPersona());
        registrar(cuenta.getId(), TipoMovimientoCuenta.ABONO, pago.getMonto(), "Pago aprobado: " + pago.getConcepto(), pago);
    }

    /**
     * El cargo de este pago ya no se debe (tramite rechazado, cargo de matricula cancelado):
     * se revierte con un abono. Solo si el pago tiene cargo y aun no tiene abono.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void anularCargoPago(Pago pago, String motivo) {
        if (!movimientoCuentaRepository.existsByPagoIdAndTipo(pago.getId(), TipoMovimientoCuenta.CARGO)
                || movimientoCuentaRepository.existsByPagoIdAndTipo(pago.getId(), TipoMovimientoCuenta.ABONO)) {
            return;
        }
        CuentaEstudiante cuenta = obtenerOCrearCuenta(pago.getIdPersona());
        registrar(cuenta.getId(), TipoMovimientoCuenta.ABONO, pago.getMonto(), motivo + ": " + pago.getConcepto(), pago);
    }

    private static String recortar(String texto) {
        return texto.length() <= MAX_CONCEPTO ? texto : texto.substring(0, MAX_CONCEPTO);
    }
}
