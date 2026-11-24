package pe.edu.upeu.lamb.finanzas.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.edu.upeu.lamb.finanzas.entity.CuentaEstudiante;
import pe.edu.upeu.lamb.finanzas.entity.MovimientoCuenta;
import pe.edu.upeu.lamb.finanzas.entity.Pago;
import pe.edu.upeu.lamb.finanzas.entity.TipoMovimientoCuenta;
import pe.edu.upeu.lamb.finanzas.repository.CuentaEstudianteRepository;
import pe.edu.upeu.lamb.finanzas.repository.MovimientoCuentaRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SaldoCuentaServiceTest {

    private CuentaEstudiante cuenta;
    private List<MovimientoCuenta> movimientos;
    private SaldoCuentaService servicio;

    @BeforeEach
    void setUp() {
        cuenta = CuentaEstudiante.builder().id(1L).idPersona(7L).saldoActual(BigDecimal.ZERO).build();
        movimientos = new ArrayList<>();
        CuentaEstudianteRepository cuentas = mock(CuentaEstudianteRepository.class);
        MovimientoCuentaRepository movs = mock(MovimientoCuentaRepository.class);
        when(cuentas.findByIdPersona(7L)).thenReturn(Optional.of(cuenta));
        when(cuentas.findByIdParaActualizar(1L)).thenReturn(Optional.of(cuenta));
        when(cuentas.save(any())).thenAnswer(i -> i.getArgument(0));
        when(movs.save(any())).thenAnswer(i -> {
            movimientos.add(i.getArgument(0));
            return i.getArgument(0);
        });
        when(movs.existsByPagoIdAndTipo(anyLong(), any())).thenAnswer(i -> movimientos.stream()
                .anyMatch(m -> m.getPago() != null && m.getPago().getId().equals(i.getArgument(0))
                        && m.getTipo() == i.getArgument(1)));
        servicio = new SaldoCuentaService(cuentas, movs);
    }

    private Pago pago(long id, String monto) {
        return Pago.builder().id(id).idPersona(7L).concepto("Matricula 2026-2").monto(new BigDecimal(monto)).build();
    }

    @Test
    void pagoAprobadoSeDescuentaDelSaldoAFavor() {
        servicio.registrar(1L, TipoMovimientoCuenta.ABONO, new BigDecimal("500.00"), "Saldo inicial", null);
        servicio.descontarPago(pago(1, "175.00"));
        assertThat(cuenta.getSaldoActual()).isEqualByComparingTo("325.00");
        assertThat(movimientos).extracting(MovimientoCuenta::getTipo)
                .containsExactly(TipoMovimientoCuenta.ABONO, TipoMovimientoCuenta.CARGO);
    }

    @Test
    void pagoMayorQueElSaldoLoDejaNegativoComoDeuda() {
        servicio.registrar(1L, TipoMovimientoCuenta.ABONO, new BigDecimal("100.00"), "Saldo inicial", null);
        servicio.descontarPago(pago(1, "350.00"));
        assertThat(cuenta.getSaldoActual()).isEqualByComparingTo("-250.00");
    }

    @Test
    void noDescuentaDosVecesElMismoPago() {
        Pago p = pago(1, "350.00");
        servicio.descontarPago(p);
        servicio.descontarPago(p);
        assertThat(movimientos).hasSize(1);
        assertThat(cuenta.getSaldoActual()).isEqualByComparingTo("-350.00");
    }

    @Test
    void anularCargoAntiguoLoRevierte() {
        // Cargo creado antes del cambio (al generarse el pago): rechazarlo lo revierte con un ABONO.
        Pago p = pago(2, "25.00");
        servicio.registrar(1L, TipoMovimientoCuenta.CARGO, p.getMonto(), "Carnet", p);
        servicio.anularCargoPago(p, "Pago rechazado, se anula el cargo");
        assertThat(cuenta.getSaldoActual()).isEqualByComparingTo("0.00");
    }

    @Test
    void anularSinCargoPrevioNoHaceNada() {
        servicio.anularCargoPago(pago(3, "25.00"), "x");
        assertThat(movimientos).isEmpty();
        assertThat(cuenta.getSaldoActual()).isEqualByComparingTo("0.00");
    }

    @Test
    void pagoEnCeroNoGeneraMovimiento() {
        servicio.descontarPago(pago(4, "0.00"));
        assertThat(movimientos).isEmpty();
    }

    @Test
    void abonoSumaSaldoAFavor() {
        servicio.registrar(1L, TipoMovimientoCuenta.ABONO, new BigDecimal("50.00"), "Ajuste manual: pago en exceso", null);
        assertThat(cuenta.getSaldoActual()).isEqualByComparingTo("50.00");
    }
}
