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
 * Mantiene el saldo de la cuenta del estudiante. El saldo es lo que el estudiante tiene A FAVOR
 * (credito que la universidad le abona): un ABONO lo sube, un CARGO lo baja. Cada pago aprobado
 * se descuenta de ese saldo. Si el pago supera el saldo disponible, el saldo queda negativo y
 * negativo = el estudiante DEBE ese monto.
 *
 * saldo = suma(ABONO) - suma(CARGO). Todo cambio de saldo pasa por aqui y deja un
 * MovimientoCuenta, asi el saldo siempre se explica con su historial de movimientos.
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
        // ABONO suma saldo a favor; CARGO lo descuenta.
        BigDecimal delta = tipo == TipoMovimientoCuenta.ABONO ? monto : monto.negate();
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

    /**
     * Pago aprobado: su monto se descuenta del saldo a favor del estudiante (CARGO). Si el saldo
     * no alcanza queda negativo (deuda). Idempotente por pago: si el pago ya tiene un CARGO
     * (p. ej. cargos generados antes de este cambio, al crearse el pago) no se descuenta dos veces.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void descontarPago(Pago pago) {
        if (pago.getMonto().signum() <= 0 || movimientoCuentaRepository.existsByPagoIdAndTipo(pago.getId(), TipoMovimientoCuenta.CARGO)) {
            return;
        }
        CuentaEstudiante cuenta = obtenerOCrearCuenta(pago.getIdPersona());
        registrar(cuenta.getId(), TipoMovimientoCuenta.CARGO, pago.getMonto(), "Pago aprobado: " + pago.getConcepto(), pago);
    }

    /**
     * Revierte con un ABONO un CARGO que ya existia para este pago (tramite rechazado, cargo de
     * matricula cancelado). Solo si el pago tiene CARGO y aun no tiene ABONO. Con el flujo actual
     * un pago solo genera CARGO al aprobarse, asi que esto solo actua sobre cargos antiguos.
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
